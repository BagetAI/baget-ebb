import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type LifeBucket = 
  | 'Foundation' 
  | 'Focus' 
  | 'Domestic' 
  | 'Growth' 
  | 'Recovery' 
  | 'Transition' 
  | 'White Space' 
  | 'Digital Sunset';

export interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end: string;
}

export interface UserPreferences {
  user_id: string;
  wake_time: string;
  sleep_time: string;
  work_days: string[]; // ['Monday', 'Tuesday', ...]
  work_hours: string; // "09:00 - 18:00"
  commute_minutes: number;
  interests: string;
  downtime_preferences?: string;
}

export interface PreferenceMatchResult {
  categorized_events: Array<CalendarEvent & { category: LifeBucket }>;
  conflicts: Array<{
    event_id?: string;
    event_title: string;
    category: LifeBucket;
    preference_violated: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  stolen_time_minutes: number;
}

/**
 * AI Calendar Preference Matching Engine
 * Compares user preferences against calendar events to identify 'Stolen Time'.
 */
export async function match_preferences_to_events(
  preferences: UserPreferences,
  events: CalendarEvent[]
): Promise<PreferenceMatchResult> {
  const prompt = `
    You are the Ebb Preference Matching Engine. 
    Compare the following user preferences with their current calendar events.
    
    USER PREFERENCES:
    - Sleep Window: ${preferences.sleep_time} to ${preferences.wake_time}
    - Work Days: ${preferences.work_days.join(', ')}
    - Work Hours: ${preferences.work_hours}
    - Interests/Hobbies: ${preferences.interests}
    
    CALENDAR EVENTS:
    ${JSON.stringify(events, null, 2)}
    
    TASK:
    1. Categorize each event into one of these 8 Ebb life-buckets: 
       'Foundation', 'Focus', 'Domestic', 'Growth', 'Recovery', 'Transition', 'White Space', 'Digital Sunset'.
    2. Identify CONFLICTS where an event "steals time" from a user priority.
       - Focus (Work) events outside work hours or on non-work days.
       - Events overlapping with Foundation (Sleep) window.
       - Focus (Work) events encroaching on Growth (Interests) time (implied evening/weekend time).
    3. Calculate total "Stolen Time" in minutes.
    
    OUTPUT: Return a JSON object with:
    {
      "categorized_events": [{ "title": "...", "start": "...", "end": "...", "category": "..." }],
      "conflicts": [{ "event_title": "...", "category": "...", "preference_violated": "...", "severity": "high/medium/low", "suggestion": "..." }],
      "stolen_time_minutes": 120
    }
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are a precise life-design AI. Output strictly valid JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result as PreferenceMatchResult;
}
