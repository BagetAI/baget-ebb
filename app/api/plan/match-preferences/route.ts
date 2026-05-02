import { NextRequest, NextResponse } from 'next/server';
import { match_preferences_to_events, UserPreferences, CalendarEvent } from '../../../lib/ai/preference-matcher';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * AI Calendar Preference Matching API
 * POST /api/plan/match-preferences
 * Body: { userId: string, manualEvents?: CalendarEvent[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, manualEvents } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch User Profile
    const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.rows.find((p: any) => p.user_id === userId);

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // 2. Prepare Preferences
    const preferences: UserPreferences = {
      user_id: userProfile.user_id,
      wake_time: userProfile.wake_time,
      sleep_time: userProfile.sleep_time,
      work_days: typeof userProfile.work_days === 'string' ? JSON.parse(userProfile.work_days) : userProfile.work_days,
      work_hours: userProfile.work_hours,
      commute_minutes: userProfile.commute_minutes,
      interests: userProfile.interests
    };

    // 3. Prepare Calendar Events (Real fetch or manual override for testing)
    let calendarEvents: CalendarEvent[] = manualEvents || [];

    if (!manualEvents || manualEvents.length === 0) {
        // Fallback to demo events if nothing provided
        calendarEvents = [
            { title: 'Late Strategy Sync', start: '2026-05-02T22:30:00Z', end: '2026-05-02T23:30:00Z' }, // Conflicts with sleep
            { title: 'Team Standup', start: '2026-05-02T09:00:00Z', end: '2026-05-02T09:30:00Z' },
            { title: 'Project Focus', start: '2026-05-03T10:00:00Z', end: '2026-05-03T12:00:00Z' }, // Weekend work conflict
            { title: 'Grocery Run', start: '2026-05-02T18:00:00Z', end: '2026-05-02T19:00:00Z' }
        ];
    }

    // 4. Run the AI Matching Engine
    console.log(`Running preference matching for: ${userId}`);
    const matchResult = await match_preferences_to_events(preferences, calendarEvents);

    // 5. Return JSON list of conflicts for the WhatsApp coach
    return NextResponse.json({
      success: true,
      userId,
      matchResult
    });

  } catch (error: any) {
    console.error('Preference Matching Error:', error);
    return NextResponse.json({ error: 'System error during preference matching.' }, { status: 500 });
  }
}
