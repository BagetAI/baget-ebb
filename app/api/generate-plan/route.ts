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
      return NextResponse.json({ error: 'Life Design profile not found.' }, { status: 404 });
    }

    // 2. Fetch User Integration (Google OAuth metadata)
    const integrationsResponse = await fetch(`https://baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
    const integrations = await integrationsResponse.json();
    const userIntegration = integrations.find((i: any) => i.user_id === userId);

    // 3. Simulated "High-Conflict" Calendar
    // This demonstrates how the AI identifies and resolves schedule creep (e.g. late meetings).
    const simulatedCalendar = [
      { title: 'Project Steering Committee', start: '09:00', end: '10:30', day: 'Monday' },
      { title: 'All Hands Meeting', start: '11:00', end: '12:00', day: 'Tuesday' },
      { title: 'Late Client Call (CONFLICT)', start: '21:30', end: '22:30', day: 'Monday' }, 
      { title: 'Court Hearing Prep', start: '14:00', end: '17:00', day: 'Wednesday' },
      { title: 'Urgent Sync', start: '08:00', end: '08:45', day: 'Thursday' }
    ];

    // 4. Invoke the AI Life Design Engine
    console.log(`Analyzing life design for: ${userId}`);
    const resetPlan = await generateResetPlan(userProfile, simulatedCalendar);

    // 5. Persist the new plan version
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
      console.warn('Persistence failed, but plan was generated.');
    }

    // 6. Return the design
    return NextResponse.json(resetPlan);

  } catch (error: any) {
    console.error('Reset Plan Generation Failure:', error);
    return NextResponse.json({ error: 'System error during life design analysis.' }, { status: 500 });
  }
}
