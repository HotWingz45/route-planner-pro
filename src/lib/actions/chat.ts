// Server-only. Runs the AI intake layer:
//   1. Verify the caller via their Supabase access token.
//   2. Enforce the free-tier weekly conversation limit.
//   3. Send the message + recent history to Claude with a tool definition.
//   4. If Claude calls the tool, merge the extracted fields into the user's
//      profile, persist them, then run the EXISTING deterministic engine
//      (src/lib/engine.ts) against real catalog data — Claude never
//      generates payout numbers itself, it only extracts structured intent.
//   5. Save both messages to chat_messages and return the reply + route.
//
// This file must never be imported from client code — it uses
// process.env.ANTHROPIC_API_KEY and the Supabase service role key.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabaseForUser, getServerSupabaseAdmin } from "../supabase/server";
import { hasActiveAccess } from "../access";
import { buildRoute, applyWeekly, effectiveTime } from "../engine";
import { mapActivity, mapWeeklyModifier, buildPlayerProfile } from "../supabase/mappers";
import type { Database } from "../supabase/database.types";
import type { PlayerProfile, RiskLevel, SessionLength } from "../types";

type PlayerStateUpdate = Database["public"]["Tables"]["player_state"]["Update"];

const ALLOWED_SESSION_LENGTHS: SessionLength[] = [30, 60, 90, 120, 180];

function clampSessionLength(minutes: number): SessionLength {
  return ALLOWED_SESSION_LENGTHS.reduce((closest, v) =>
    Math.abs(v - minutes) < Math.abs(closest - minutes) ? v : closest,
  );
}

const SYSTEM_PROMPT = `You are the ScorePath intake assistant for a GTA companion planning app.
Your ONLY job is to extract structured facts about the player's situation from natural conversation and call the update_profile_and_plan tool.
You NEVER invent payout numbers, activity names, or game mechanics yourself — the app's deterministic engine calculates all of that from real data after you extract the player's inputs.
If the player hasn't given you enough to call the tool usefully (e.g. you don't know their session time or balance), ask ONE short clarifying question instead of guessing.
Keep replies brief and conversational — you are a fast, sharp planning assistant, not a chatbot that pads its answers.
Never claim to be affiliated with Rockstar Games or Take-Two Interactive.`;

const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  accessToken: z.string().min(1),
});

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
interface AnthropicTextBlock {
  type: "text";
  text: string;
}
type AnthropicContentBlock = AnthropicToolUseBlock | AnthropicTextBlock;

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInputSchema.parse(data))
  .handler(async ({ data }) => {
    const baseUrl = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(
      /\/$/,
      "",
    );
    const model = process.env.CHAT_MODEL ?? "claude-sonnet-5";
    const apiKey = process.env.ANTHROPIC_API_KEY;
    // A key is only required for the hosted Anthropic API — local
    // Anthropic-compatible endpoints (e.g. Ollama) ignore it. When neither is
    // configured, degrade gracefully instead of erroring so the rest of the
    // app stays fully usable on deployments without an AI budget.
    const aiConfigured =
      !baseUrl.includes("api.anthropic.com") ||
      (apiKey && apiKey.startsWith("sk-ant-") && !apiKey.includes("your-key"));
    if (!aiConfigured) {
      return {
        reply:
          "The AI planner isn't enabled on this server yet — but the manual planner does everything the AI does, free and unlimited. Head to the Planner tab to build your route.",
        recommendation: null,
        conversationId: data.conversationId ?? null,
        limitReached: false as const,
      };
    }

    // 1. Verify caller identity via their own Supabase session token (RLS-scoped client).
    const userClient = getServerSupabaseForUser(data.accessToken);
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      throw new Error("Not authenticated. Log in to use the AI planner.");
    }
    const userId = userRes.user.id;

    // Admin client for the trusted writes below (weekly limit counter, chat rows,
    // profile updates on the user's own behalf after we've already verified identity).
    const admin = getServerSupabaseAdmin();

    // 2. Enforce free-tier weekly AI conversation limit.
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select(
        "subscription_tier, launch_pass_expires_at, ai_conversations_used_this_week, ai_conversations_reset_at",
      )
      .eq("id", userId)
      .single();
    if (profileErr) throw profileErr;

    // Central access check — also treats a launch_pass that expired since the
    // last nightly downgrade job as free tier.
    const paidAccess = hasActiveAccess({
      subscriptionTier: profile.subscription_tier,
      launchPassExpiresAt: profile.launch_pass_expires_at,
    });

    const now = new Date();
    let usedThisWeek = profile.ai_conversations_used_this_week;
    if (new Date(profile.ai_conversations_reset_at) <= now) {
      usedThisWeek = 0;
      await admin
        .from("profiles")
        .update({
          ai_conversations_used_this_week: 0,
          ai_conversations_reset_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
        })
        .eq("id", userId);
    }
    if (!paidAccess && usedThisWeek >= 3) {
      return {
        reply:
          "You've used your 3 free AI conversations this week. Upgrade to Pro for unlimited AI route planning, or use the manual planner — it's still free and unlimited.",
        recommendation: null,
        conversationId: data.conversationId ?? null,
        limitReached: true as const,
      };
    }

    // 3. Get or create the conversation.
    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: conv, error: convErr } = await admin
        .from("chat_conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (convErr) throw convErr;
      conversationId = conv.id;
    }

    // 4. Load recent history for conversational context (last 10 messages).
    const { data: history } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    // 5. Load the player's current state so Claude has context and only needs
    // to extract what's NEW or CHANGED, not re-ask everything every message.
    const [stateRes, goalRes, invRes] = await Promise.all([
      admin.from("player_state").select("*").eq("user_id", userId).single(),
      admin.from("goals").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle(),
      admin.from("player_inventory").select("item_id, favorite").eq("user_id", userId),
    ]);
    if (stateRes.error) throw stateRes.error;

    const currentProfile: PlayerProfile = buildPlayerProfile(
      stateRes.data,
      goalRes.data ?? null,
      (invRes.data ?? []).map((r) => r.item_id),
      (invRes.data ?? []).filter((r) => r.favorite).map((r) => r.item_id),
      [],
      {
        id: "goal-default",
        type: "earn-money",
        label: "Build savings",
        targetAmount: 1000000,
        createdAt: new Date().toISOString(),
      },
    );

    // 6. Call Claude with a tool definition for structured intake.
    const anthropicMessages = [
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: data.message },
    ];

    const contextNote = `Known player state right now: balance=$${currentProfile.currentBalance}, sessionLength=${currentProfile.sessionLength}min, playStyle=${currentProfile.playStyle}, risk=${currentProfile.preferredRisk}, goal="${currentProfile.goal.label}" (target $${currentProfile.goal.targetAmount}). Only include fields in your tool call that the player is setting or changing in THIS message — omit fields you're not updating.`;

    const anthropicRes = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey ?? "ollama",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        // Local thinking models (qwen3 etc.) spend output tokens on reasoning
        // before the tool call, so this cap must leave room for both.
        max_tokens: 1200,
        system: `${SYSTEM_PROMPT}\n\n${contextNote}`,
        messages: anthropicMessages,
        tools: [
          {
            name: "update_profile_and_plan",
            description:
              "Call this once you have enough information to generate or refresh the player's route. Only include fields the player actually specified or changed.",
            input_schema: {
              type: "object",
              properties: {
                currentBalance: {
                  type: "number",
                  description: "Player's current in-game cash balance.",
                },
                sessionLengthMinutes: {
                  type: "number",
                  description: "How many minutes the player has to play right now.",
                },
                playStyle: { type: "string", enum: ["solo", "small-crew", "large-crew", "mixed"] },
                preferredRisk: { type: "string", enum: ["low", "medium", "high"] },
                preferActive: {
                  type: "boolean",
                  description: "True if they want active gameplay over passive income.",
                },
                goalLabel: {
                  type: "string",
                  description: "Short label for what they're saving for.",
                },
                goalTargetAmount: {
                  type: "number",
                  description: "Total cash needed for their goal.",
                },
                replyMessage: {
                  type: "string",
                  description:
                    "A short, conversational reply to show the player alongside their route (1-2 sentences).",
                },
              },
              required: ["replyMessage"],
            },
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      throw new Error(`Chat model API error (${anthropicRes.status}): ${errBody}`);
    }

    const anthropicData = (await anthropicRes.json()) as { content: AnthropicContentBlock[] };
    const toolUse = anthropicData.content.find(
      (b): b is AnthropicToolUseBlock => b.type === "tool_use",
    );
    const textBlock = anthropicData.content.find((b): b is AnthropicTextBlock => b.type === "text");

    let replyText = textBlock?.text ?? "Got it.";
    let recommendation = null as ReturnType<typeof buildRoute> | null;
    let updatedProfile = currentProfile;

    if (toolUse) {
      const input = toolUse.input as {
        currentBalance?: number;
        sessionLengthMinutes?: number;
        playStyle?: PlayerProfile["playStyle"];
        preferredRisk?: RiskLevel;
        preferActive?: boolean;
        goalLabel?: string;
        goalTargetAmount?: number;
        replyMessage?: string;
      };
      replyText = input.replyMessage ?? replyText;

      const statePatch: PlayerStateUpdate = {};
      if (input.currentBalance !== undefined)
        statePatch.current_balance = Math.max(0, Math.round(input.currentBalance));
      if (input.sessionLengthMinutes !== undefined)
        statePatch.session_length = clampSessionLength(input.sessionLengthMinutes);
      if (input.playStyle !== undefined) statePatch.play_style = input.playStyle;
      if (input.preferredRisk !== undefined) statePatch.preferred_risk = input.preferredRisk;
      if (input.preferActive !== undefined) statePatch.prefer_active = input.preferActive;

      if (Object.keys(statePatch).length > 0) {
        await admin.from("player_state").update(statePatch).eq("user_id", userId);
      }

      let goalForRoute = currentProfile.goal;
      if (input.goalLabel !== undefined || input.goalTargetAmount !== undefined) {
        await admin
          .from("goals")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("is_active", true);
        const { data: newGoal } = await admin
          .from("goals")
          .insert({
            user_id: userId,
            type: "earn-money",
            label: input.goalLabel ?? currentProfile.goal.label,
            target_amount: Math.round(input.goalTargetAmount ?? currentProfile.goal.targetAmount),
            is_active: true,
          })
          .select()
          .single();
        if (newGoal) {
          await admin
            .from("player_state")
            .update({ active_goal_id: newGoal.id })
            .eq("user_id", userId);
          goalForRoute = {
            id: newGoal.id,
            type: newGoal.type,
            label: newGoal.label,
            targetAmount: newGoal.target_amount,
            targetItemId: newGoal.target_item_id ?? undefined,
            createdAt: newGoal.created_at,
          };
        }
      }

      updatedProfile = {
        ...currentProfile,
        currentBalance: (statePatch.current_balance as number) ?? currentProfile.currentBalance,
        sessionLength: (statePatch.session_length as SessionLength) ?? currentProfile.sessionLength,
        playStyle:
          (statePatch.play_style as PlayerProfile["playStyle"]) ?? currentProfile.playStyle,
        preferredRisk: (statePatch.preferred_risk as RiskLevel) ?? currentProfile.preferredRisk,
        preferActive: (statePatch.prefer_active as boolean) ?? currentProfile.preferActive,
        goal: goalForRoute,
      };

      // Run the REAL deterministic engine against REAL catalog data.
      const [activitiesRes, weeklyRes] = await Promise.all([
        admin.from("activities").select("*").eq("available", true),
        admin.from("weekly_modifiers").select("*").gt("expires_at", new Date().toISOString()),
      ]);
      const activities = (activitiesRes.data ?? []).map(mapActivity);
      const weekly = (weeklyRes.data ?? []).map(mapWeeklyModifier);

      if (activities.length > 0) {
        recommendation = buildRoute(updatedProfile, activities, weekly);

        // Audited engine output: snapshot in, ranked steps out, plus the
        // calculation basis so any recommendation can be explained later.
        // Derived entirely from engine exports — engine.ts itself stays
        // content-agnostic and untouched.
        await admin.from("recommendations").insert({
          user_id: userId,
          source: "chat",
          player_state_snapshot: updatedProfile as unknown as Record<string, unknown>,
          steps: recommendation.steps.map((s) => ({
            activityId: s.activity.id,
            activityName: s.activity.name,
            estimatedMinutes: s.estimatedMinutes,
            estimatedPayoutMin: s.estimatedPayoutMin,
            estimatedPayoutMax: s.estimatedPayoutMax,
            rationale: s.rationale,
          })) as unknown as Record<string, unknown>[],
          calculation_basis: {
            engineVersion: 1,
            includeSetupTime: updatedProfile.includeSetupTime,
            sessionLengthMinutes: updatedProfile.sessionLength,
            activeWeeklyModifierIds: weekly.map((w) => w.id),
            perStep: recommendation.steps.map((s) => {
              const mult = applyWeekly(s.activity, weekly);
              const minutes = effectiveTime(s.activity, updatedProfile.includeSetupTime);
              return {
                activityId: s.activity.id,
                weeklyMultiplier: mult,
                effectiveMinutes: minutes,
                avgPayoutPerMinute: Math.round(
                  (s.estimatedPayoutMin + s.estimatedPayoutMax) / 2 / Math.max(minutes, 1),
                ),
              };
            }),
            expectedPayout: recommendation.expectedPayout,
            goalProgressAfter: recommendation.goalProgressAfter,
          },
        });
      }
    }

    // 7. Persist both messages.
    await admin.from("chat_messages").insert([
      { conversation_id: conversationId, user_id: userId, role: "user", content: data.message },
      {
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: replyText,
        recommendation: recommendation as unknown as Record<string, unknown> | null,
      },
    ]);
    await admin
      .from("profiles")
      .update({ ai_conversations_used_this_week: usedThisWeek + 1 })
      .eq("id", userId);
    await admin
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return {
      reply: replyText,
      recommendation,
      conversationId,
      limitReached: false as const,
    };
  });
