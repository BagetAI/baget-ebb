import { SCREEN_TIME_REFLECTION_PROMPT } from './prompts';

export interface StolenTimeReport {
  weekly_stolen_hours: number;
  top_thief: string;
  vulnerable_windows: string[];
  analysis: string;
}

export interface CoachingPrompt {
  id: string;
  trigger: 'morning' | 'evening' | 'conflict';
  message: string;
}

export interface ScreenTimeAnalysis {
  stolen_time_report: StolenTimeReport;
  coaching_prompts: CoachingPrompt[];
}

/**
 * AI Screen-Time Reflection Analysis Engine
 * Correlates screen time data with calendar blocks to identify Time Theft.
 */
export async function analyzeScreenTime(profile: any, plan: any): Promise<ScreenTimeAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY missing. Using static fallback for Screen-Time Analysis.");
    return generateStaticAnalysis(profile);
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
          { role: "system", content: SCREEN_TIME_REFLECTION_PROMPT },
          { 
            role: "user", 
            content: `USER PROFILE:\n${JSON.stringify({
              interests: profile.interests,
              screen_time_avg_minutes: profile.screen_time_avg_minutes,
              screen_time_breakdown: profile.screen_time_breakdown
            }, null, 2)}\n\nRESET PLAN BLOCKS:\n${JSON.stringify(plan.blocks, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) throw new Error("OpenAI API call failed");

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as ScreenTimeAnalysis;

  } catch (error) {
    console.error("AI Screen-Time Analysis failed:", error);
    return generateStaticAnalysis(profile);
  }
}

/**
 * Static fallback for Screen-Time Analysis if AI is unavailable.
 */
function generateStaticAnalysis(profile: any): ScreenTimeAnalysis {
  const avgMin = profile.screen_time_avg_minutes || 180;
  const stolenHours = Math.round((avgMin * 7 / 60) * 0.4 * 10) / 10; // Assume 40% is stolen

  return {
    stolen_time_report: {
      weekly_stolen_hours: stolenHours,
      top_thief: "Reactive Digital Noise",
      vulnerable_windows: ["evening transition", "morning ritual"],
      analysis: `based on your daily average of ${avgMin} minutes, you are likely losing ${stolenHours} hours per week to digital leakage during your planned recovery blocks.`
    },
    coaching_prompts: [
      {
        id: "1",
        trigger: "evening",
        message: "evening. we noticed digital leakage usually starts around now. shall we lock the phone for your sunset ritual?"
      },
      {
        id: "2",
        trigger: "morning",
        message: "morning. today, let's try to protect your first 30 minutes from 'stolen time' to keep your foundations clear."
      },
      {
        id: "3",
        trigger: "conflict",
        message: "hi. you have a growth block coming up. in the past, screen time has stolen this window. ready to stay intentional?"
      }
    ]
  };
}
