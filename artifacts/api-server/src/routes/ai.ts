import { Router, type IRouter, type RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { ReviewHabitsBody, ReviewHabitsResponse } from "@workspace/api-zod";
import { hasProEntitlement } from "../lib/revenuecat";

const router: IRouter = Router();
const requireAuth: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

const requirePro: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId || !(await hasProEntitlement(userId))) {
    res.status(403).json({ error: "Habit Garden Pro is required" });
    return;
  }
  next();
};

router.post("/ai/habit-review", requireAuth, requirePro, async (req, res): Promise<void> => {
  const parsed = ReviewHabitsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service is not configured" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPINFRA_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        max_tokens: 1200,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Du bist ein freundlicher Habit-Coach. Antworte ausschließlich als JSON mit summary (string) und suggestions (string array, maximal 4). Keine medizinischen Behauptungen, kein Druck, keine Schuldzuweisungen.",
          },
          { role: "user", content: JSON.stringify(parsed.data) },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    req.log.error({ error }, "DeepInfra request failed");
    res.status(502).json({ error: "AI service is temporarily unavailable" });
    return;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    req.log.error({ status: response.status }, "DeepInfra returned an error");
    res.status(502).json({ error: "AI service returned an error" });
    return;
  }

  const completion = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  let result: { summary?: string; suggestions?: string[] };
  try {
    result = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    req.log.warn("DeepInfra returned malformed JSON");
    res.status(502).json({ error: "AI service returned an invalid response" });
    return;
  }
  res.json(ReviewHabitsResponse.parse({
    summary: result.summary ?? "Deine Gewohnheiten bilden bereits eine gute Grundlage.",
    suggestions: (result.suggestions ?? []).slice(0, 4),
  }));
});

export default router;