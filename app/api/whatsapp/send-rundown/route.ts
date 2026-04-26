
import { NextRequest, NextResponse } from 'next/server';

const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';

/**
 * Trigger Endpoint to send a daily rundown to a user.
 * POST /api/whatsapp/send-rundown
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // 1. Fetch Profile and Latest Plan
    const [profileRes, planRes] = await Promise.all([
      fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`),
      fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`)
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

    const plan = JSON.parse(latestPlanRow.plan_json);
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    
    // Filter blocks for today
    const todaysBlocks = plan.blocks.filter((b: any) => b.day === dayName).slice(0, 4);

    if (todaysBlocks.length === 0) {
      return NextResponse.json({ error: 'No blocks for today' });
    }

    // 2. Format Message
    const blockList = todaysBlocks
      .map((b: any) => `- ${b.start_time}: ${b.title}`)
      .join('\n');

    const message = `Good morning. Your Ebb Reset Plan for ${dayName} is ready:\n\n${blockList}\n\nReply 1 to Accept and Sync.\nReply 2 to Chat/Adjust.`;

    // 3. Send Message (Simulated / Logic for SDK)
    console.log(`Sending WhatsApp to ${profile.whatsapp}: ${message}`);

    // LOG the outbound message
    await fetch(`https://baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          message_sid: `sim_${Math.random().toString(36).substr(2, 9)}`,
          body: message,
          direction: 'outbound',
          timestamp: new Date().toISOString()
        }
      })
    });

    // In production, you'd call Twilio here:
    // await twilioClient.messages.create({ body: message, from: 'whatsapp:+1...', to: `whatsapp:${profile.whatsapp}` });

    return NextResponse.json({ success: true, messageSent: message });

  } catch (error: any) {
    console.error('Send Rundown Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
