
import { google } from 'googleapis';

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * Refreshes the Google OAuth access token using a refresh token.
 */
export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  return response.json();
}

/**
 * Fetches events from the user's primary Google Calendar.
 */
export async function fetchGoogleCalendarEvents(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.summary,
    start: item.start.dateTime || item.start.date,
    end: item.end.dateTime || item.end.date,
  }));
}

/**
 * Securely writes an event to the Ebb Reset Plan calendar.
 * Prevents overwriting primary calendar data.
 */
export async function secureGoogleCalendarWrite(accessToken: string, userId: string, calendarId: string, event: any) {
  // Validation: Never write to primary
  if (calendarId === 'primary') {
    throw new Error('SECURITY_VIOLATION: Writing to primary calendar is prohibited.');
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google API Error: ${err.error.message}`);
  }

  return response.json();
}

/**
 * Updates an existing calendar event (e.g., reschedule).
 */
export async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string, updates: any) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google API Error: ${err.error.message}`);
  }

  return response.json();
}

/**
 * Maps a ResetBlock to a Google Calendar event object.
 */
export function mapBlockToGoogleEvent(block: any, startAnchor: Date) {
  const dayOffset = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(block.day);
  const date = new Date(startAnchor);
  date.setDate(date.getDate() + dayOffset);

  const [startH, startM] = block.start_time.split(':');
  const [endH, endM] = block.end_time.split(':');

  const start = new Date(date);
  start.setHours(parseInt(startH), parseInt(startM), 0);

  const end = new Date(date);
  end.setHours(parseInt(endH), parseInt(endM), 0);
  
  // Handle overnight
  if (end < start) end.setDate(end.getDate() + 1);

  return {
    summary: `Ebb: ${block.title}`,
    description: block.description,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    colorId: block.category === 'Foundation' ? '8' : block.category === 'Focus' ? '6' : '1',
  };
}

/**
 * Utility to get the ISO date of the next Monday.
 */
export function getNextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay() + 1) % 7 || 7));
  d.setHours(0, 0, 0, 0);
  return d;
}
