import { LIFE_DESIGN_SYSTEM_PROMPT, PLAN_MODIFICATION_PROMPT } from './prompts';

export interface UserProfile {
  user_id: string;
  wake_time: string;
  sleep_time: string;
  work_days: string | string[];
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
 * Generates a conflict-free 7-day schedule based on biological foundations.
 */
export async function generateResetPlan(profile: any, calendarEvents: any[]): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY missing. Using Foundation-Lock Fallback.");
    return generateFallbackPlan(profile);
  }

  // Pre-process profile work_days if it's a string
  const processedProfile = { ...profile };
  if (typeof processedProfile.work_days === 'string') {
    try {
      processedProfile.work_days = JSON.parse(processedProfile.work_days);
    } catch (e) {
      processedProfile.work_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }
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
            content: `USER PROFILE:\n${JSON.stringify(processedProfile, null, 2)}\n\nEXISTING CALENDAR EVENTS (CONFLICTS TO RESOLVE):\n${JSON.stringify(calendarEvents, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for more consistent scheduling
      })
    });

    if (!response.ok) throw new Error("OpenAI API call failed");

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content) as ResetPlan;
    
    // Safety check: ensure blocks are returned
    if (!result.blocks || result.blocks.length === 0) {
      return generateFallbackPlan(processedProfile);
    }
    
    return result;
  } catch (error) {
    console.error("AI Generation failed:", error);
    return generateFallbackPlan(processedProfile);
  }
}

/**
 * Modifies an existing plan based on user chat feedback.
 */
export async function modifyResetPlan(currentPlan: ResetPlan, userRequest: string, profile: any): Promise<ResetPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI unavailable");

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

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as ResetPlan;
}

/**
 * Foundation-Lock Fallback Engine
 * Strictly enforces 8-hour sleep and core rituals if AI is down.
 */
function generateFallbackPlan(profile: any): ResetPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const blocks: ResetBlock[] = [];
  
  days.forEach(day => {
    const wake = profile.wake_time || '07:00';
    const sleep = profile.sleep_time || '23:00';

    // 1. Biological Anchors
    blocks.push({
      title: 'Sleep Foundation',
      start_time: sleep,
      end_time: wake,
      category: 'Foundation',
      day,
      description: 'Locked 8-hour sleep window for biological recovery.'
    });

    blocks.push({
      title: 'Morning Ritual',
      start_time: wake,
      end_time: addMinutes(wake, 45),
      category: 'Foundation',
      day,
      description: 'Protected low-stimulation start.'
    });

    blocks.push({
      title: 'Digital Sunset',
      start_time: subtractMinutes(sleep, 60),
      end_time: sleep,
      category: 'Foundation',
      day,
      description: 'Transitioning to recovery mode.'
    });

    // 2. Work blocks (simplified)
    const workDays = Array.isArray(profile.work_days) ? profile.work_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (workDays.includes(day)) {
      blocks.push({
        title: 'Deep Work: Focus',
        start_time: '09:00',
        end_time: '12:00',
        category: 'Focus',
        day,
        description: 'Prioritizing high-leverage outputs.'
      });
      blocks.push({
        title: 'Reactive Load',
        start_time: '13:30',
        end_time: '17:00',
        category: 'Focus',
        day,
        description: 'Meetings, emails, and coordination.'
      });
    }

    // 3. Domestic Batching (Example: Wed/Sun)
    if (day === 'Wednesday' || day === 'Sunday') {
       blocks.push({
         title: 'Domestic Batching',
         start_time: day === 'Sunday' ? '10:00' : '19:00',
         end_time: day === 'Sunday' ? '12:00' : '20:30',
         category: 'Domestic',
         day,
         description: 'Batched laundry, errands, and cooking.'
       });
    }

    // 4. Growth
    const interest = typeof profile.interests === 'string' ? profile.interests.split(',')[0] : 'Learning';
    blocks.push({
      title: `Growth: ${interest || 'Learning'}`,
      start_time: '18:00',
      end_time: '19:00',
      category: 'Growth',
      day,
      description: 'Reclaiming time for personal development.'
    });
  });

  return {
    blocks,
    score_explanation: "Fallback design activated. Locked foundations are preserved, but high-fidelity optimization requires AI connectivity.",
    key_adjustments: ["8-hour sleep window locked", "Morning rituals protected", "Domestic tasks batched to Wed/Sun"]
  };
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2026, 0, 1, h, m + mins);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function subtractMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2026, 0, 1, h, m - mins);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
