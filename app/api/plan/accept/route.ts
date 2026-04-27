
import { NextRequest, NextResponse } from 'next/server';
import { 
  refreshGoogleAccessToken, 
  secureGoogleCalendarWrite, 
  mapBlockToGoogleEvent, 
  getNextMonday 
} from '../../../lib/google-calendar';

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

/**
 * Accept Reset Plan API - Updated with Secure Write Layer
 * strictly enforces the 'Never Overwrite' rule and 'Approved-Only' target.
 * POST /api/plan/accept
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch User Integration (Tokens + Calendar ID)
    const integrationsRes = await fetch(`https://baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
    const integrations = await integrationsRes.json();
    const integration = integrations.find((i: any) => i.user_id === userId);

    if (!integration || !integration.refresh_token || !integration.reset_calendar_id) {
      return NextResponse.json({ 
        error: 'Calendar integration not found or incomplete. Please reconnect Google Calendar.' 
      }, { status: 404 });
    }

    // 2. Fetch Latest Reset Plan
    const plansRes = await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
    const plans = await plansRes.json();
    const latestPlanRow = plans
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!latestPlanRow || !latestPlanRow.plan_json) {
      return NextResponse.json({ error: 'No Reset Plan found to sync.' }, { status: 404 });
    }

    const plan = JSON.parse(latestPlanRow.plan_json);

    // 3. Refresh Google Token (Integrated with process.env.GOOGLE_CLIENT_SECRET in the lib)
    let accessToken;
    try {
      const tokenData = await refreshGoogleAccessToken(integration.refresh_token);
      accessToken = tokenData.access_token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return NextResponse.json({ error: 'Failed to authenticate with Google. Please re-sign in.' }, { status: 401 });
    }

    // 4. Sync Blocks using the SECURE Write Layer
    const startAnchor = getNextMonday();
    const syncPromises = plan.blocks.map((block: any) => {
      const googleEvent = mapBlockToGoogleEvent(block, startAnchor);
      // The secure layer validates the calendarId against the DB and ensures ONLY creation (no overwrite)
      return secureGoogleCalendarWrite(accessToken, userId, integration.reset_calendar_id, googleEvent);
    });

    // Execute sync
    const results = await Promise.allSettled(syncPromises);
    const failedCount = results.filter(r => r.status === 'rejected').length;

    // 5. Update Plan Status
    await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          plan_json: latestPlanRow.plan_json,
          status: 'synced',
          created_at: new Date().toISOString()
        }
      })
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${results.length - failedCount} blocks to the Ebb Reset Calendar.`,
      failedCount
    });

  } catch (error: any) {
    console.error('Plan Acceptance Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
