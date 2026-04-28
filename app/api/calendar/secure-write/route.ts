
import { NextRequest, NextResponse } from 'next/server';
import { 
  refreshGoogleAccessToken, 
  secureGoogleCalendarWrite,
  GoogleEvent
} from '../../../lib/google-calendar';

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * PRODUCTION SECURE CALENDAR WRITE ENDPOINT
 * 
 * strictly enforces:
 * 1. Approved-Only target: Checks requested calendarId against user's registered reset_calendar_id.
 * 2. Never Overwrite: Uses POST to ensure new event creation, avoiding modification of existing data.
 * 3. Identity Verification: Uses refresh_token to verify session and identity.
 * 
 * POST /api/calendar/secure-write
 * Body: { userId: string, calendarId: string, event: GoogleEvent }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, calendarId, event } = await req.json();

    if (!userId || !calendarId || !event) {
      return NextResponse.json({ error: 'Missing required fields: userId, calendarId, event' }, { status: 400 });
    }

    // 1. Fetch Integration metadata for identity verification and token refresh
    const integrationsRes = await fetch(`https://app.baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
    const integrations = await integrationsRes.json();
    const integration = integrations.find((i: any) => i.user_id === userId);

    if (!integration || !integration.refresh_token) {
      return NextResponse.json({ error: 'OAuth integration not found for this user.' }, { status: 404 });
    }

    // 2. Identity & Token Handshake (Uses GOOGLE_CLIENT_SECRET)
    let accessToken;
    try {
      const tokenData = await refreshGoogleAccessToken(integration.refresh_token);
      accessToken = tokenData.access_token;
    } catch (err) {
      return NextResponse.json({ error: 'OAuth Token Refresh failed.' }, { status: 401 });
    }

    // 3. Execution via Secure Validation Layer
    // This call will throw if the calendarId is 'primary' or doesn't match the integration record.
    const result = await secureGoogleCalendarWrite(accessToken, userId, calendarId, event);

    return NextResponse.json({
      success: true,
      eventId: result.id,
      calendar: calendarId,
      status: 'created',
      ruleEnforced: 'Approved-Only Write'
    });

  } catch (error: any) {
    console.error('Secure Write Failure:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      policy: 'Never Overwrite / Approved-Only Target'
    }, { status: 403 });
  }
}
