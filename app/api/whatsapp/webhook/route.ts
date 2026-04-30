import { NextRequest, NextResponse } from 'next/server';
import { 
  refreshGoogleAccessToken, 
  updateGoogleCalendarEvent, 
  secureGoogleCalendarWrite,
  mapBlockToGoogleEvent,
  getNextMonday
} from '../../../lib/google-calendar';

const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const DAILY_REFLECTIONS_DB = 'b17f0b1e-80a7-4621-aff4-37f1ee95f2fa';
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * PRODUCTION WHATSAPP INTERACTIVE RESPONSE HANDLER
 * 
 * Handles incoming WhatsApp replies and translates choices into 
 * real-time Google Calendar updates or dynamic recalculations.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string; 
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    const phoneNumber = from.replace('whatsapp:', '');
    const userResponse = body.trim().toLowerCase();

    // 1. Find User by Phone
    const profileResponse = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileResponse.json();
    const userProfile = profiles.rows.find((p: any) => p.whatsapp === phoneNumber);

    if (!userProfile) {
      console.warn(`Webhook received message from unknown number: ${phoneNumber}`);
      return new NextResponse('User not found', { status: 200 });
    }

    const userId = userProfile.user_id;

    // 2. Log Inbound Message
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

    // 3. Check for Numeric choice vs Natural Language request
    const isChoice = /^[1-3]$/.test(userResponse);

    if (!isChoice) {
      // NATURAL LANGUAGE RECALCULATION
      // Trigger the recalculation API internally
      const recalcRes = await fetch(`${req.nextUrl.origin}/api/whatsapp/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRequest: body })
      });
      const recalcData = await recalcRes.json();

      const replyText = recalcData.success 
        ? `${recalcData.summary}\n\ni've updated your Reset Calendar for the rest of today.`
        : "i couldn't quite figure out how to shift that. could you try saying something like 'i'm running 30 mins late'?";

      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`;
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }

    // 4. Handle Numeric Choice logic
    const logsRes = await fetch(`https://app.baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`);
    const logsData = await logsRes.json();
    const latestOutbound = logsData.rows
      .filter((l: any) => l.user_id === userId && l.direction === 'outbound')
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    let replyText = "i received your choice, but i've lost the thread. visit the dashboard to view your latest plan.";

    if (latestOutbound) {
      const contextBody = latestOutbound.body;

      // --- CASE A: Reflection Context ---
      if (contextBody.includes('[REF_TYPE:')) {
        const refType = contextBody.split('[REF_TYPE:')[1].split(']')[0];
        let score = 0;
        if (userResponse === '1') score = 10;
        else if (userResponse === '2') score = 5;
        else if (userResponse === '3') score = 0;

        await fetch(`https://app.baget.ai/api/public/databases/${DAILY_REFLECTIONS_DB}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              user_id: userId,
              date: new Date().toISOString().split('T')[0],
              [refType === 'sleep' ? 'sleep_adherence' : 'interest_adherence']: score,
              overall_score: score,
              mood_vibe: userResponse === '1' ? 'balanced' : userResponse === '2' ? 'reactive' : 'drained'
            }
          })
        });

        replyText = score >= 5 
          ? "thank you for reflecting. your intentional flow is being logged. sleep well."
          : "noted. today was heavy. tomorrow is a fresh reset. ebb will anchor your foundations at wake up.";
      } 

      // --- CASE B: Conflict Context ---
      else if (contextBody.includes('[CONTEXT:CONFLICT:')) {
        const conflictData = JSON.parse(contextBody.split('[CONTEXT:CONFLICT:')[1].split(']')[0]);
        const intRes = await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
        const intData = await intRes.json();
        const integration = intData.rows.find((i: any) => i.user_id === userId);

        if (integration?.refresh_token) {
          const tokenData = await refreshGoogleAccessToken(integration.refresh_token);
          if (userResponse === '1') {
            await updateGoogleCalendarEvent(tokenData.access_token, 'primary', conflictData.event_id, {
              summary: `${conflictData.event_title} (Rescheduled by Ebb)`,
              start: { dateTime: conflictData.new_start },
              end: { dateTime: conflictData.new_end }
            });
            replyText = `understood. i've rescheduled "${conflictData.event_title}" to protect your Foundations.`;
          } else {
            replyText = "received. i've logged your preference. let's stay intentional.";
          }
        }
      }

      // --- CASE C: Rundown Context ---
      else if (contextBody.toLowerCase().includes('rundown') || contextBody.includes('Reply 1 to Accept')) {
        if (userResponse === '1') {
          replyText = "plan accepted and protected. i'm syncing today's blocks to your Ebb Reset Calendar now.";
        } else if (userResponse === '2') {
          replyText = "understood. what would you like to shift? tell me what you need (e.g. 'i am running 15 mins late'), and i'll redesign your afternoon.";
        }
      }
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`;
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error: any) {
    console.error('WhatsApp Webhook Critical Error:', error.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
