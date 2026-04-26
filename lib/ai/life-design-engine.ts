import { LIFE_DESIGN_SYSTEM_PROMPT, PLAN_MODIFICATION_PROMPT } from './prompts';

export interface UserProfile {
  wake_time: string;
  sleep_time: string;
  work_hours: string;
  commute_minutes: number;
  chore_hours_weekly: number;
  downtime_hours: number;
  social_hours: number;
  interests: string;
  screen_time_avg_minutes: number;
}

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
 * Generates a structured Reset Plan using the AI Life Design agent.
 */
export async function generateResetPlan(profile: UserProfile, calendarEvents: any[]): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
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
            { role: "system", content: LIFE_DESIGN_SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ profile, calendarEvents }) }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("AI Generation failed, falling back to deterministic engine", e);
    }
  }

  // Fallback Deterministic Logic
  return generateFallbackPlan(profile);
}

/**
 * Modifies an existing plan based on user feedback.
 */
export async function modifyResetPlan(currentPlan: ResetPlan, userRequest: string, profile: UserProfile): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
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
            { role: "system", content: PLAN_MODIFICATION_PROMPT },
            { role: "user", content: JSON.stringify({ currentPlan, userRequest, profile }) }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("AI Modification failed", e);
      throw new Error("Failed to modify plan via AI");
    }
  }

  // Simple mock modification for local dev without key
  return {
    ...currentPlan,
    score_explanation: `I've noted your request: "${userRequest}". (AI key missing, simulated update applied).`,
    key_adjustments: [...currentPlan.key_adjustments, "Manual adjustment processed."]
  };
}

function generateFallbackPlan(profile: UserProfile): ResetPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const blocks: ResetBlock[] = [];
  
  days.forEach(day => {
    blocks.push({
      title: 'Sleep & Recovery',
      start_time: profile.sleep_time || '23:00',
      end_time: profile.wake_time || '07:00',
      category: 'Foundation',
      day,
      description: 'Biological non-negotiable.'
    });

    if (!['Saturday', 'Sunday'].includes(day)) {
      blocks.push({
        title: 'Morning Ritual',
        start_time: profile.wake_time || '07:00',
        end_time: '07:45',
        category: 'Foundation',
        day,
        description: 'Mindful start.'
      });
    }
  });

  return {
    blocks,
    score_explanation: "Fallback plan generated. Connect OpenAI for high-fidelity life design.",
    key_adjustments: ["Protected sleep windows."]
  };
}
