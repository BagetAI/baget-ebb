
import { NextRequest, NextResponse } from 'next/server';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';

/**
 * TRIGGER ENDPOINT: Send a Conflict Resolution Question via WhatsApp
 * Used to test the interactive response handler.
 * 
 * POST /api/whatsapp/conflict/trigger
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    // 1. Fetch Profile and latest Plan
    const [profileRes, planRes] = await Promise.all([
      fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`),
      fetch(`https://app.baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`)
    ]);

    const profiles = await profileRes.json();
    const plans = await planRes.json();

    const profile = profiles.rows.find((p: any) => p.user_id === userId);
    const latestPlanRow = plans.rows
      .filter((p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!profile || !latestPlanRow) {
      return NextResponse.json({ error: 'User profile or plan not found' }, { status: 404 });
    }

    // 2. Simulate Conflict Data (In production, this comes from the Conflict Resolver AI)
    const conflictEvent = {
      event_id: 'ev_123_demo',
      event_title: 'Late Client Strategy Call',
      new_start: new Date(new Date().setHours(10, 0, 0)).toISOString(),
      new_end: new Date(new Date().setHours(11, 0, 0)).toISOString()
    };

    const message = `hello ${profile.interests.split(',')[0].toLowerCase() || 'friend'}. i noticed a conflict. your "Late Client Strategy Call" overlaps with your Foundations tonight.\n\nsleep is your primary reset. what should we do?\n\n1. move the call to tomorrow morning (reclaimed 60m)\n2. keep it (penalize reset score)\n3. skip this ebb block today`;

    // 3. Log Outbound with Metadata
    const contextTag = `[CONTEXT:CONFLICT:${JSON.stringify(conflictEvent)}]`;
    const finalBody = `${message}\n${contextTag}`;

    await fetch(`https://app.baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          message_sid: `test_conf_${Math.random().toString(36).substr(2, 9)}`,
          body: finalBody,
          direction: 'outbound',
          timestamp: new Date().toISOString()
        }
      })
    });

    console.log(`WhatsApp Conflict Triggered for ${userId}: ${message}`);

    return NextResponse.json({ 
      success: true, 
      messageSent: message,
      context: conflictEvent
    });

  } catch (error: any) {
    console.error('Conflict Trigger Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
