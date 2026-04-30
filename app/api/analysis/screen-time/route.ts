import { NextRequest, NextResponse } from 'next/server';
import { analyzeScreenTime } from '../../../lib/ai/screen-time-analyzer';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

/**
 * Screen-Time Reflection Analysis API
 * POST /api/analysis/screen-time
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
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // 2. Fetch Latest Reset Plan
    const plansResponse = await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
    const plans = await plansResponse.json();
    const latestPlanRow = plans
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!latestPlanRow) {
      return NextResponse.json({ error: 'No Reset Plan found. Please generate a plan first.' }, { status: 404 });
    }

    const plan = JSON.parse(latestPlanRow.plan_json);

    // 3. Invoke the AI Screen-Time Analysis Engine
    console.log(`Analyzing screen-time theft for: ${userId}`);
    const analysis = await analyzeScreenTime(userProfile, plan);

    // 4. Return the analysis report and prompts
    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Screen-Time Analysis Error:', error);
    return NextResponse.json({ error: 'System error during screen-time analysis.' }, { status: 500 });
  }
}
