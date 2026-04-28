import { NextRequest, NextResponse } from 'next/server';
import { generateResetPlan } from '../../../lib/ai/life-design-engine';
import { refreshGoogleAccessToken, fetchGoogleCalendarEvents } from '../../../lib/google-calendar';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * AI Calendar Reset Generation Endpoint
 * POST /api/generate-plan
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch User Profile
    const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.find((p: any) => p.user_id === userId);

    if (!userProfile) {
      return NextResponse.json({ error: 'Life Design profile not found.' }, { status: 404 });
    }

    // 2. Fetch User Integration (Google OAuth metadata)
    const integrationsResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
    const integrations = await integrationsResponse.json();
    const userIntegration = integrations.find((i: any) => i.user_id === userId);

    let calendarEvents = [];
    if (userIntegration && userIntegration.refresh_token) {
      try {
        const tokenData = await refreshGoogleAccessToken(userIntegration.refresh_token);
        calendarEvents = await fetchGoogleCalendarEvents(tokenData.access_token);
      } catch (err) {
        console.warn('Failed to fetch real calendar events, falling back to empty list.', err);
      }
    }

    // 3. If no real events, use simulated data for demonstration
    if (calendarEvents.length === 0) {
      calendarEvents = [
        { title: 'Project Steering Committee', start: '2026-04-27T09:00:00Z', end: '2026-04-27T10:30:00Z' },
        { title: 'Late Client Call (CONFLICT)', start: '2026-04-27T21:30:00Z', end: '2026-04-27T22:30:00Z' },
        { title: 'All Hands Meeting', start: '2026-04-28T11:00:00Z', end: '2026-04-28T12:00:00Z' }
      ];
    }

    // 4. Invoke the AI Life Design Engine
    console.log(`Analyzing life design for: ${userId}`);
    const resetPlan = await generateResetPlan(userProfile, calendarEvents);

    // 5. Persist the new plan version
    const saveResponse = await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          plan_json: JSON.stringify(resetPlan),
          status: 'draft',
          created_at: new Date().toISOString()
        }
      })
    });

    // 6. Return the design
    return NextResponse.json(resetPlan);

  } catch (error: any) {
    console.error('Reset Plan Generation Failure:', error);
    return NextResponse.json({ error: 'System error during life design analysis.' }, { status: 500 });
  }
}
