import { NextRequest, NextResponse } from 'next/server';
import { generateResetPlan } from '../../../lib/ai/life-design-engine';

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
    const profileResponse = await fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.find((p: any) => p.user_id === userId);

    if (!userProfile) {
      return NextResponse.json({ error: 'Life Design profile not found. Please complete onboarding first.' }, { status: 404 });
    }

    // 2. Fetch User Integration (Google OAuth metadata)
    const integrationsResponse = await fetch(`https://baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
    const integrations = await integrationsResponse.json();
    const userIntegration = integrations.find((i: any) => i.user_id === userId);

    // 3. Fetch/Simulate Calendar Data
    // In a production app, we would use userIntegration.access_token to fetch real Google events.
    // For this beta cohort, we simulate a "High-Conflict" schedule to demonstrate the AI's logic.
    const simulatedCalendar = [
      { title: 'Project Steering Committee', start: '09:00', end: '10:30', day: 'Monday' },
      { title: 'All Hands Meeting', start: '11:00', end: '12:00', day: 'Tuesday' },
      { title: 'Late Client Call', start: '21:00', end: '22:00', day: 'Monday' }, // This violates sleep foundation
      { title: 'Court Hearing (Mock)', start: '14:00', end: '17:00', day: 'Wednesday' },
      { title: 'Board Prep', start: '19:00', end: '21:00', day: 'Thursday' }
    ];

    // 4. Invoke the Life Design Engine (AI-powered)
    console.log(`Triggering Life Design Engine for User: ${userId}`);
    const resetPlan = await generateResetPlan(userProfile, simulatedCalendar);

    // 5. Persist the plan to the database
    // We store the JSON string to enable versioning and historical audits of life design shifts.
    const saveResponse = await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
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

    if (!saveResponse.ok) {
      console.warn('Reset Plan generated but failed to persist to database.');
    }

    // 6. Return the structured 7-day proposal
    return NextResponse.json(resetPlan);

  } catch (error: any) {
    console.error('CRITICAL: Reset Plan Generation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate Reset Plan.', 
      details: error.message 
    }, { status: 500 });
  }
}
