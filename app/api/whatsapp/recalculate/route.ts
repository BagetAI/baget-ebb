import { NextRequest, NextResponse } from 'next/server';
import { recalculateRemainingDay } from '../../../../lib/ai/recalculation-engine';
import { 
  refreshGoogleAccessToken, 
  listEventsForDay, 
  deleteGoogleCalendarEvent, 
  secureGoogleCalendarWrite, 
  mapBlockToGoogleEvent 
} from '../../../../lib/google-calendar';

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';

/**
 * DYNAMIC CALENDAR RECALCULATION API
 * 
 * triggered by WhatsApp natural language requests.
 * POST /api/whatsapp/recalculate
 * Body: { userId: string, userRequest: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, userRequest } = await req.json();

    if (!userId || !userRequest) {
      return NextResponse.json({ error: 'userId and userRequest required' }, { status: 400 });
    }

    // 1. Fetch User Integration and Latest Plan
    const [intRes, planRes] = await Promise.all([
      fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`),
      fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`)
    ]);

    const integrations = await intRes.json();
    const plans = await planRes.json();

    const integration = integrations.rows.find((i: any) => i.user_id === userId);
    const latestPlanRow = plans.rows
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!integration || !latestPlanRow) {
      return NextResponse.json({ error: 'Integration or Plan not found' }, { status: 404 });
    }

    const currentPlan = JSON.parse(latestPlanRow.plan_json);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);

    // 2. AI Recalculation
    console.log(`Recalculating calendar for ${userId}: ${userRequest}`);
    const { updated_blocks, adjustment_summary } = await recalculateRemainingDay(
      currentPlan, 
      userRequest, 
      currentTime, 
      dayName
    );

    // 3. Update Database with new blocks (Merge with existing blocks for other days)
    const newPlanBlocks = currentPlan.blocks.filter((b: any) => b.day !== dayName);
    
    // We also need to keep the past blocks for today
    const pastBlocksForToday = currentPlan.blocks.filter((b: any) => b.day === dayName && b.end_time < currentTime);
    
    const finalBlocks = [...newPlanBlocks, ...pastBlocksForToday, ...updated_blocks];

    const updatedPlan = {
      ...currentPlan,
      blocks: finalBlocks,
      key_adjustments: [...(currentPlan.key_adjustments || []), adjustment_summary]
    };

    await fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          plan_json: JSON.stringify(updatedPlan),
          status: 'recalculated',
          created_at: new Date().toISOString()
        }
      })
    });

    // 4. Update Google Calendar
    if (integration.refresh_token && integration.reset_calendar_id) {
      const tokenData = await refreshGoogleAccessToken(integration.refresh_token);
      const accessToken = tokenData.access_token;

      // Fetch existing events for today in the Reset Calendar
      const existingEvents = await listEventsForDay(accessToken, integration.reset_calendar_id, now.toISOString());
      
      // Filter events that haven't ended yet
      const eventsToDelete = existingEvents.filter((ev: any) => {
        const end = ev.end.dateTime || ev.end.date;
        return new Date(end) > now;
      });

      // Delete future events
      await Promise.allSettled(eventsToDelete.map((ev: any) => deleteGoogleCalendarEvent(accessToken, integration.reset_calendar_id, ev.id)));

      // Write new blocks
      // We need an anchor date (the start of this current week)
      const anchorDate = new Date();
      anchorDate.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); // Back to Monday

      const writePromises = updated_blocks.map((block: any) => {
        const googleEvent = mapBlockToGoogleEvent(block, anchorDate);
        return secureGoogleCalendarWrite(accessToken, userId, integration.reset_calendar_id, googleEvent);
      });

      await Promise.allSettled(writePromises);
    }

    return NextResponse.json({
      success: true,
      summary: adjustment_summary,
      updated_blocks_count: updated_blocks.length
    });

  } catch (error: any) {
    console.error('Recalculation API Critical Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
