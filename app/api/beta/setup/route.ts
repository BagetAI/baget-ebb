import { NextRequest, NextResponse } from 'next/server';

const USER_PROFILES_DB = 'c9645913-5df8-4132-83b7-f9dc5096e26c';
const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

// The "Test Credential" for Private Beta Hub access
const BETA_ACCESS_CODE = 'EBB-BETA-2026';

export async function POST(req: NextRequest) {
  try {
    const { userId, accessCode } = await req.json();

    // Verify Beta Access Code
    if (accessCode !== BETA_ACCESS_CODE) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid access code. Please check your beta invitation.' 
      }, { status: 403 });
    }

    // 1. Initialize Profile for the test user
    await fetch(`https://app.baget.ai/api/public/databases/${USER_PROFILES_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          whatsapp: '+1234567890',
          wake_time: '07:00',
          sleep_time: '23:00',
          work_days: '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
          work_hours: '09:00 - 18:00',
          commute_minutes: 45,
          chore_hours_weekly: 6,
          interests: 'Reading, Guitar, Meditating',
          screen_time_avg_minutes: 120
        },
        externalKey: userId // Upsert
      })
    });

    // 2. Initialize Integration (Set to Active/Paid status to bypass paywall)
    await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user_id: userId,
          email: 'beta-tester@ebb.ai',
          access_token: 'demo_token',
          refresh_token: 'demo_refresh',
          expiry_date: Date.now() + 86400000,
          reset_calendar_id: 'ebb_test_cal_123',
          sync_status: 'active'
        },
        externalKey: userId // Upsert
      })
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Beta environment initialized. Access granted.' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
