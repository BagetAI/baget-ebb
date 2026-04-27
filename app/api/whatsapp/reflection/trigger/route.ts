import { NextRequest, NextResponse } from 'next/server';
import { generateDailyReflection } from '../../../../lib/ai/reflection-engine';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const RESET_PLANS_DB = 'a91590e2-5711-48b0-833f-19d7bcbbb29c';
const WHATSAPP_LOGS_DB = '3672786f-0de3-4c64-8286-38f09c27b8dc';

/**
 * Trigger Endpoint to send a daily reflection check-in to a user.
 * POST /api/whatsapp/reflection/trigger
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

    // 2. Generate Reflection via AI
    const reflection = await generateDailyReflection(profile, plan);

    // 3. Format Message with Options
    const optionsText = reflection.options
      .map(opt => `${opt.id}. ${opt.label}`)
      .join('\n');

    const finalMessage = `${reflection.message}\n\n${optionsText}`;

    // 4. Log the outbound message
    // We store the reflection context in the message body or a separate way to parse it later
    // For this prototype, we'll append a hidden metadata tag or just rely on the latest outbound message logic
    const logBody = `${finalMessage}\n[REF_TYPE:${reflection.reflection_type}]`;

    await fetch(`https://baget.ai/api/public/databases/${WHATSAPP_LOGS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          message_sid: `ref_${Math.random().toString(36).substr(2, 9)}`,
          body: logBody,
          direction: 'outbound',
          timestamp: new Date().toISOString()
        }
      })
    });

    // In production, call Twilio:
    console.log(`Sending WhatsApp Reflection to ${profile.whatsapp}: ${logBody}`);

    return NextResponse.json({ success: true, reflectionSent: reflection });

  } catch (error: any) {
    console.error('Reflection Trigger Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
