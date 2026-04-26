import { NextRequest, NextResponse } from 'next/server';
import { generateResetPlan } from '../../../lib/ai/life-design-engine';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch Simulated Calendar Data (or real if available)
    // For now, we simulate existing meetings to show the AI's conflict resolution
    const simulatedCalendar = [
      { title: 'Project Sync', start: '10:00', end: '11:00', day: 'Monday' },
      { title: 'Doctor Appt', start: '14:00', end: '15:00', day: 'Wednesday' }
    ];

    // 3. Generate the Plan via the Life Design Engine
    const resetPlan = await generateResetPlan(userProfile, simulatedCalendar);

    // 4. Save to ResetPlans database for persistence
    await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
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

    return NextResponse.json(resetPlan);
  } catch (error: any) {
    console.error('Error generating reset plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
