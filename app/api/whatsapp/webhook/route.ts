import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const DAILY_REFLECTIONS_DB = 'b17f0b1e-80a7-4621-aff4-37f1ee95f2fa';

/**
 * Webhook for incoming WhatsApp messages (Twilio formatted)
 * Handles "1", "2", "3" responses for Rundowns and Reflections.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string; 
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    const phoneNumber = from.replace('whatsapp:', '');

    // 1. Find User by Phone
    const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.find((p: any) => p.whatsapp === phoneNumber);

    if (!userProfile) {
      return new NextResponse('User not found', { status: 200 });
    }

    const userId = userProfile.user_id;

    // 2. Log Message
    await fetch(`https://app.baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`, {
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

    // 3. Determine Context from latest Outbound
    const logsRes = await fetch(`https://app.baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`);
    const allLogs = await logsRes.json();
    const latestOutbound = allLogs
      .filter((l: any) => l.user_id === userId && l.direction === 'outbound')
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    let replyText = "i didn't quite catch that. reply 1, 2, or 3 to accept or reflect.";

    if (!latestOutbound) {
       return new NextResponse('No context', { status: 200 });
    }

    const isReflection = latestOutbound.body.includes('[REF_TYPE:');
    const responseId = body.trim();

    if (isReflection) {
      // Process Reflection
      const refType = latestOutbound.body.split('[REF_TYPE:')[1].split(']')[0];
      let score = 0;
      if (responseId === '1') score = 10;
      else if (responseId === '2') score = 5;
      else if (responseId === '3') score = 0;

      // Save Daily Reflection Score
      await fetch(`https://app.baget.ai/api/public/databases/${DAILY_REFLECTIONS_DB}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            [refType === 'sleep' ? 'sleep_adherence' : 'interest_adherence']: score,
            overall_score: score,
            mood_vibe: responseId === '1' ? 'balanced' : responseId === '2' ? 'reactive' : 'drained'
          }
        })
      });

      replyText = score >= 5 
        ? "thank you for reflecting. your intentional flow is being logged. sleep well."
        : "noted. today was heavy. tomorrow is a fresh reset. ebb will anchor your foundations at wake up.";
        
    } else {
      // Process Rundown Acceptance
      if (responseId === '1') {
        replyText = "plan accepted and protected. i've synced your blocks for today.";
      } else if (responseId === '2') {
        replyText = "understood. what would you like to shift? i'm listening.";
      }
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`;
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
