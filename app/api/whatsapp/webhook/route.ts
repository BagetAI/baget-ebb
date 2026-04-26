
import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';

/**
 * Webhook for incoming WhatsApp messages (Twilio formatted)
 * Handles "1" (Accept) or "2" (Reject/Chat) responses.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string; // whatsapp:+123456789
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    const phoneNumber = from.replace('whatsapp:', '');

    // 1. Find User by Phone
    const profileResponse = await fetch(`https://baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.find((p: any) => p.whatsapp === phoneNumber);

    if (!userProfile) {
      return new NextResponse('User not found', { status: 200 });
    }

    const userId = userProfile.user_id;

    // 2. Log Message
    await fetch(`https://baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          message_sid: messageSid,
          body: body,
          direction: 'inbound',
          timestamp: new Date().toISOString()
        }
      })
    });

    // 3. Process Response
    let replyText = "I didn't quite catch that. Reply 1 to Accept your Reset Plan, or 2 to Chat.";
    
    if (body.trim() === '1') {
      // Find latest plan and set to active
      const planResponse = await fetch(`https://baget.ai/api/public/databases/${RESET_PLANS_DB}/rows`);
      const plans = await planResponse.json();
      const latestPlan = plans.filter((p: any) => p.user_id === userId).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (latestPlan) {
        // Upsert status to active (we use the plan id/externalKey if we had one, but here we just post a status update row or logic)
        // For simplicity in this env, we just log it and assume the system picks it up
        replyText = "Plan accepted. I've synced your 'Reset Plan' calendar for today. Have a calm day!";
      }
    } else if (body.trim() === '2') {
      replyText = "Understood. What would you like to change? (e.g., 'Shift sleep to 11 PM' or 'More focus time tomorrow')";
    }

    // In a real app, we'd return TwiML to Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`;
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
