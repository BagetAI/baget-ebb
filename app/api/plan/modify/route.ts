import { NextRequest, NextResponse } from 'next/server';
import { modifyResetPlan } from '../../../lib/ai/life-design-engine';

const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';

/**
 * API Route to modify a Reset Plan based on user chat feedback.
 * POST /api/plan/modify
 * Body: { userId: string, userRequest: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, userRequest } = await req.json();

    if (!userId || !userRequest) {
      return NextResponse.json({ error: 'userId and userRequest are required' }, { status: 400 });
    }

    // 1. Fetch current plan and profile
    const [profileRes, planRes] = await Promise.all([
      fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`),
      fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`)
    ]);

    const profiles = await profileRes.json();
    const plans = await planRes.json();

    const profile = profiles.find((p: any) => p.user_id === userId);
    const latestPlanRow = plans
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!profile || !latestPlanRow) {
      return NextResponse.json({ error: 'Profile or Plan not found' }, { status: 404 });
    }

    const currentPlan = JSON.parse(latestPlanRow.plan_json);

    // 2. Use AI to modify the plan
    const updatedPlan = await modifyResetPlan(currentPlan, userRequest, profile);

    // 3. Save the new version of the plan
    await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          plan_json: JSON.stringify(updatedPlan),
          status: 'modified',
          created_at: new Date().toISOString()
        }
      })
    });

    return NextResponse.json(updatedPlan);

  } catch (error: any) {
    console.error('Plan Modification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
