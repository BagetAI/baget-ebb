import { NextRequest, NextResponse } from 'next/server';

const BETA_ACCESS_CODE = 'EBB-BETA-2026';

/**
 * BETA LOGIN API
 * POST /api/auth/login
 * Body: { accessCode: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { accessCode } = await req.json();

    if (!accessCode) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    if (accessCode === BETA_ACCESS_CODE) {
      return NextResponse.json({ 
        success: true, 
        message: 'Access granted',
        token: 'beta_access_session_valid_2026'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid access code. Please verify your invitation.' 
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
