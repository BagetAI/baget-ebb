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
 */
export async function secureGoogleCalendarWrite(accessToken: string, userId: string, calendarId: string, event: any) {
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
    throw new Error(`Google API Error: ${err.error?.message || 'Unknown'}`);
  }

  return response.json();
}

/**
 * Updates an existing Google Calendar event.
 */
export async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string, event: any) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google API Patch Error: ${err.error?.message || 'Unknown'}`);
  }

  return response.json();
}

/**
 * Lists events for a specific day in a specific calendar.
 */
export async function listEventsForDay(accessToken: string, calendarId: string, date: string) {
  const timeMin = new Date(date);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(date);
  timeMax.setHours(23, 59, 59, 999);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.items || [];
}

/**
 * Deletes an event from a calendar.
 */
export async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete Google Calendar event');
  }
}

/**
 * Utility: Map Reset Block to Google Event.
 */
export function mapBlockToGoogleEvent(block: any, anchorDate: Date) {
  const dayOffsetMap: { [key: string]: number } = {
    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
  };
  
  const targetDate = new Date(anchorDate);
  targetDate.setDate(targetDate.getDate() + dayOffsetMap[block.day]);
  
  const [startH, startM] = block.start_time.split(':').map(Number);
  const [endH, endM] = block.end_time.split(':').map(Number);
  
  const start = new Date(targetDate);
  start.setHours(startH, startM, 0, 0);
  
  const end = new Date(targetDate);
  end.setHours(endH, endM, 0, 0);

  // Handle overnight blocks (e.g. sleep 23:00 to 07:00)
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  return {
    summary: block.title,
    description: `${block.description}\n\n[ebb_category:${block.category}]`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    colorId: block.category === 'Foundation' ? '8' : block.category === 'Growth' ? '10' : '5'
  };
}

/**
 * Utility: Get upcoming Monday.
 */
export function getNextMonday() {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}
