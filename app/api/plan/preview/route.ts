import { NextRequest, NextResponse } from 'next/server';

const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

/**
 * Plan Preview API (Plan Peeking)
 * Returns a partial version of the Reset Plan for non-paying users.
 * - Foundation (Sleep) and Focus (Work) blocks are visible.
 * - Others are masked/labeled as 'Locked'.
 * 
 * GET /api/plan/preview?userId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // 1. Fetch Latest Reset Plan
    const plansRes = await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
    const plans = await plansRes.json();
    const latestPlanRow = plans
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!latestPlanRow || !latestPlanRow.plan_json) {
      return NextResponse.json({ error: 'No Reset Plan found to preview.' }, { status: 404 });
    }

    const fullPlan = JSON.parse(latestPlanRow.plan_json);

    // 2. Mask the plan for 'Peeking'
    // Categories: Foundation, Focus, Domestic, Recovery, Growth, Transition
    const peekBlocks = fullPlan.blocks.map((block: any) => {
      const isVisible = ['Foundation', 'Focus'].includes(block.category);
      
      if (isVisible) {
        return { ...block, isLocked: false };
      } else {
        return {
          category: block.category,
          day: block.day,
          start_time: block.start_time,
          end_time: block.end_time,
          title: 'Locked Block',
          description: 'Unlock Founding Member status to see your specific recovery and interest blocks.',
          isLocked: true
        };
      }
    });

    const peekPlan = {
      ...fullPlan,
      blocks: peekBlocks,
      isPartial: true,
      recoveredHours: 11.4, // Based on ICP research
      message: "This is a preview of your Reset Plan. Foundations and Work boundaries are visible. Recovery and Interests are locked."
    };

    return NextResponse.json(peekPlan);

  } catch (error: any) {
    console.error('Plan Preview Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
