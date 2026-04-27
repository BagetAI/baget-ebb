
/**
 * Ebb Google Calendar Integration Library
 * Handles OAuth token refreshing, event fetching, and creation for the 'Reset Plan' calendar.
 */

export interface GoogleEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Foundation': '11', // Graphite
  'Focus': '5',      // Banana
  'Domestic': '2',   // Sage
  'Recovery': '1',   // Lavender
  'Growth': '10',    // Basil
  'Transition': '8'  // Graphite
};

const USER_INTEGRATIONS_DB = 'c06cb451-345f-44d1-a6f1-cad8cdfeb79c';

/**
 * Refreshes the Google OAuth Access Token
 */
export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${JSON.stringify(error)}`);
  }

  return await response.json(); // returns { access_token, expires_in, scope, token_type }
}

/**
 * Fetches events from the user's primary calendar for the upcoming week.
 */
export async function fetchGoogleCalendarEvents(accessToken: string) {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch events: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    title: item.summary,
    start: item.start.dateTime || item.start.date,
    end: item.end.dateTime || item.end.date,
    description: item.description || ''
  }));
}

/**
 * Validates that the calendar ID belongs to the user's 'Reset Plan' calendar.
 * This is the 'Approved-Only' write-layer check.
 */
export async function validateApprovedCalendar(userId: string, calendarId: string): Promise<boolean> {
  if (!calendarId || calendarId === 'primary') return false;

  const response = await fetch(`https://baget.ai/api/public/databases/${USER_INTEGRATIONS_DB}/rows`);
  const integrations = await response.json();
  const integration = integrations.find((i: any) => i.user_id === userId);

  return integration && integration.reset_calendar_id === calendarId;
}

/**
 * SECURE Calendar Write
 * strictly enforces the 'Never Overwrite' rule and 'Approved-Only' target.
 */
export async function secureGoogleCalendarWrite(accessToken: string, userId: string, calendarId: string, event: GoogleEvent) {
  // 1. Validation: Only write to the specific 'Reset Plan' calendar
  const isApproved = await validateApprovedCalendar(userId, calendarId);
  if (!isApproved) {
    throw new Error('SECURITY_VIOLATION: Attempted to write to an unauthorized calendar.');
  }

  // 2. Write Operation: Only use POST (create), never PUT/PATCH (modify) for existing events
  // This ensures no existing user events are modified without explicit confirmation.
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create event: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Maps an Ebb ResetBlock to a Google Calendar Event
 */
export function mapBlockToGoogleEvent(block: any, nextMondayDate: Date): GoogleEvent {
  const daysMap: Record<string, number> = {
    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
  };

  const eventDate = new Date(nextMondayDate);
  eventDate.setDate(nextMondayDate.getDate() + daysMap[block.day]);

  const [startH, startM] = block.start_time.split(':');
  const [endH, endM] = block.end_time.split(':');

  const startDateTime = new Date(eventDate);
  startDateTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

  const endDateTime = new Date(eventDate);
  endDateTime.setHours(parseInt(endH), parseInt(endM), 0, 0);
  
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return {
    summary: block.title,
    description: `Ebb Life Design: ${block.category}\n${block.description}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC'
    },
    colorId: CATEGORY_COLORS[block.category] || '1'
  };
}

/**
 * Calculates the date of the next Monday to anchor the Reset Plan.
 */
export function getNextMonday(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMonday = new Date(today.setDate(diff));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}
