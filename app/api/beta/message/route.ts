import { NextRequest, NextResponse } from 'next/server';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';

export async function POST(req: NextRequest) {
  try {
    const { userId, body } = await req.json();

    // 1. Fetch user phone from database
    const profileRes = await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`);
    const profiles = await profileRes.json();
    const profile = profiles.rows.find((p: any) => p.user_id === userId);

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 2. Simulate Twilio Webhook call
    const webhookUrl = `${req.nextUrl.origin}/api/whatsapp/webhook`;
    
    // Construct Twilio style FormData
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${profile.whatsapp}`);
    formData.append('Body', body);
    formData.append('MessageSid', `sim_sid_${Math.random().toString(36).substr(2, 9)}`);

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const replyText = await webhookRes.text();
    // Parse the TwiML reply text if possible, or just return the raw response
    const match = replyText.match(/<Message>(.*?)<\/Message>/);
    const reply = match ? match[1] : replyText;

    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
