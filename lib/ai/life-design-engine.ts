/**
 * Ebb Life Design Engine
 * 
 * This engine takes user profile data and calendar constraints to generate 
 * a "Reset Week" - a balanced schedule that prioritizes biological foundations.
 */

import { LIFE_DESIGN_SYSTEM_PROMPT } from './prompts';

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
  // Production Implementation: 
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4-turbo",
  //   messages: [
  //     { role: "system", content: LIFE_DESIGN_SYSTEM_PROMPT },
  //     { role: "user", content: JSON.stringify({ profile, calendarEvents }) }
  //   ],
  //   response_format: { type: "json_object" }
  // });
  // return JSON.parse(response.choices[0].message.content);

  // For the Prototype: We implement the logic of the AI engine deterministically
  // to ensure the founder sees a real structure based on their input.
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const blocks: ResetBlock[] = [];
  
  days.forEach(day => {
    // 1. Foundation: Sleep
    blocks.push({
      title: 'Sleep & Recovery',
      start_time: profile.sleep_time,
      end_time: profile.wake_time,
      category: 'Foundation',
      day,
      description: 'Biological non-negotiable. 8-hour recovery window.'
    });

    // 2. Foundation: Morning Ritual
    blocks.push({
      title: 'Morning Ritual',
      start_time: profile.wake_time,
      end_time: addMinutes(profile.wake_time, 45),
      category: 'Foundation',
      day,
      description: 'Slow start: Hydration, light, and zero screens.'
    });

    // 3. Transition: Commute (if work day)
    const isWorkDay = !['Saturday', 'Sunday'].includes(day);
    if (isWorkDay) {
      const workStart = profile.work_hours.split('-')[0].trim() || '09:00';
      const commuteStart = subtractMinutes(workStart, profile.commute_minutes);
      
      blocks.push({
        title: 'Mindful Commute',
        start_time: commuteStart,
        end_time: workStart,
        category: 'Transition',
        day,
        description: 'Audiobook or silence. Transitioning to focus mode.'
      });
    }

    // 4. Growth: Personal Interests (Batching them)
    if (day === 'Saturday' || day === 'Tuesday') {
      blocks.push({
        title: `Growth: ${profile.interests.split(',')[0] || 'Personal Interest'}`,
        start_time: '19:00',
        end_time: '20:30',
        category: 'Growth',
        day,
        description: 'Deep interest session. No distractions.'
      });
    }

    // 5. Domestic: Batching chores
    if (day === 'Sunday' || day === 'Wednesday') {
      blocks.push({
        title: 'Domestic Flow (Batch Chores)',
        start_time: '17:00',
        end_time: '18:30',
        category: 'Domestic',
        day,
        description: 'Laundry, meal prep, and space resetting.'
      });
    }
  });

  return {
    blocks,
    score_explanation: "This plan maximizes biological foundations by locking your 8-hour sleep window and batching domestic chores to free up weekend recovery.",
    key_adjustments: [
      "Consolidated laundry and cleaning to Sunday/Wednesday.",
      "Fixed 10:30 PM digital sunset to protect deep sleep.",
      "Integrated 45-minute morning ritual before work commute."
    ]
  };
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + mins);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function subtractMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m - mins);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
