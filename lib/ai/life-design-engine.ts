import { LIFE_DESIGN_SYSTEM_PROMPT, PLAN_MODIFICATION_PROMPT } from './prompts';

export interface UserProfile {
  user_id: string;
  wake_time: string;
  sleep_time: string;
  work_days: string[];
  work_hours: string;
  commute_minutes: number;
  chore_hours_weekly: number;
  downtime_hours: number;
  social_hours: number;
  interests: string;
  screen_time_avg_minutes: number;
  screen_time_breakdown?: string;
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
 * The Ebb Life Design Engine
 * Orchestrates the AI analysis of user life parameters and calendar data.
 */
export async function generateResetPlan(profile: any, calendarEvents: any[]): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not defined. Falling back to deterministic engine.");
    return generateFallbackPlan(profile);
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
          { role: "system", content: LIFE_DESIGN_SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Here is my profile and current calendar. Please redesign my week:\n\nPROFILE: ${JSON.stringify(profile)}\n\nCALENDAR: ${JSON.stringify(calendarEvents)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Basic validation of the AI output
    if (!result.blocks || !Array.isArray(result.blocks)) {
      throw new Error("Invalid AI response: 'blocks' array missing.");
    }

    return result as ResetPlan;
  } catch (error) {
    console.error("AI Generation failed:", error);
    return generateFallbackPlan(profile);
  }
}

/**
 * Refines a plan based on iterative user feedback.
 */
export async function modifyResetPlan(currentPlan: ResetPlan, userRequest: string, profile: any): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("AI modification unavailable: OPENAI_API_KEY missing.");
  }

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
        { 
          role: "user", 
          content: JSON.stringify({ currentPlan, userRequest, profile }) 
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error("AI modification request failed.");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as ResetPlan;
}

/**
 * Emergency Fallback Engine
 * Provides a basic structure if the AI is unreachable.
 */
function generateFallbackPlan(profile: any): ResetPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const blocks: ResetBlock[] = [];
  
  days.forEach(day => {
    // 8-hour Sleep Foundation
    blocks.push({
      title: 'Sleep Foundation',
      start_time: profile.sleep_time || '23:00',
      end_time: profile.wake_time || '07:00',
      category: 'Foundation',
      day,
      description: 'Biological non-negotiable. Protected recovery window.'
    });

    // Morning Ritual
    blocks.push({
      title: 'Morning Ritual',
      start_time: profile.wake_time || '07:00',
      end_time: '07:45',
      category: 'Foundation',
      day,
      description: 'Low-stimulation start to the day.'
    });

    // Work (Mon-Fri)
    if (!['Saturday', 'Sunday'].includes(day)) {
      blocks.push({
        title: 'Focus: Primary Work',
        start_time: '09:00',
        end_time: '12:00',
        category: 'Focus',
        day,
        description: 'High-leverage deep work block.'
      });
      
      blocks.push({
        title: 'Focus: Reactive Load',
        start_time: '13:00',
        end_time: '17:00',
        category: 'Focus',
        day,
        description: 'Meetings, emails, and syncs.'
      });
    }

    // Interest / Growth (Evening)
    blocks.push({
      title: `Growth: ${profile.interests?.split(',')[0] || 'Personal Interest'}`,
      start_time: '19:00',
      end_time: '20:30',
      category: 'Growth',
      day,
      description: 'Reclaiming time for what matters.'
    });
  });

  return {
    blocks,
    score_explanation: "This is a foundational fallback plan. Connect OpenAI to unlock high-fidelity life design optimized for your specific constraints.",
    key_adjustments: ["Locked 8-hour sleep foundation", "Protected morning rituals", "Allocated growth sessions"]
  };
}
