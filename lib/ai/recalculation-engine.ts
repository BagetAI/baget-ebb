import { LIFE_DESIGN_SYSTEM_PROMPT } from './prompts';

export interface ResetBlock {
  title: string;
  start_time: string;
  end_time: string;
  category: 'Foundation' | 'Focus' | 'Domestic' | 'Recovery' | 'Growth' | 'Transition';
  day: string;
  description: string;
}

export interface ResetPlan {
  blocks: ResetBlock[];
  score_explanation: string;
  key_adjustments: string[];
}

/**
 * RECALCULATION ENGINE PROMPT
 */
const RECALCULATION_SYSTEM_PROMPT = `
You are the Ebb Dynamic Recalculation Agent. 
A user has requested a schedule shift (e.g., "I'm running 30 mins late").
Your task is to recalculate ONLY the remaining blocks for TODAY.

CORE RULES:
1. Shift the start and end times of all remaining blocks by the requested duration.
2. Maintain the priority hierarchy: Biological Foundations (Sleep, Sunset, Ritual) are non-negotiable anchors.
3. If the shift causes a work block to encroach on a Biological Anchor (like the Digital Sunset or Sleep window), you must flag this in the block's description as a "FOUNDATION CLASH" and suggest how to resolve it (e.g., "Shortened work block to protect sleep").
4. Maintain 15-minute "White Space" buffers between work events.
5. Do NOT change the day of the blocks.

INPUT FORMAT:
{
  "currentPlan": { blocks: [...] },
  "userRequest": "I'm running 30 mins late",
  "currentTime": "HH:MM",
  "day": "Monday"
}

OUTPUT FORMAT (JSON ONLY):
{
  "updated_blocks": [ ... only blocks for today that were shifted ... ],
  "adjustment_summary": "Short explanation of the shift and any foundation protection measures taken."
}
`;

/**
 * Recalculates the remainder of the day's schedule.
 */
export async function recalculateRemainingDay(
  currentPlan: ResetPlan, 
  userRequest: string, 
  currentTime: string,
  day: string
): Promise<{ updated_blocks: ResetBlock[], adjustment_summary: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: RECALCULATION_SYSTEM_PROMPT },
          { 
            role: "user", 
            content: JSON.stringify({ currentPlan, userRequest, currentTime, day })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error("OpenAI API call failed");

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("AI Recalculation failed:", error);
    throw error;
  }
}
