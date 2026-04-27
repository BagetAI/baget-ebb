import { NextRequest, NextResponse } from 'next/server';
import { resolveConflict } from '../../../lib/ai/conflict-resolver';

/**
 * AI Calendar Conflict Resolution API
 * POST /api/plan/resolve-conflict
 * Body: { existingEvent: object, proposedBlock: object }
 */
export async function POST(req: NextRequest) {
  try {
    const { existingEvent, proposedBlock } = await req.json();

    if (!existingEvent || !proposedBlock) {
      return NextResponse.json({ error: 'Missing existingEvent or proposedBlock data.' }, { status: 400 });
    }

    // Identify the clash and generate a proposal
    const proposal = await resolveConflict(existingEvent, proposedBlock);

    return NextResponse.json(proposal);

  } catch (error: any) {
    console.error('Conflict Resolution API Error:', error);
    return NextResponse.json({ error: 'System error during conflict resolution.' }, { status: 500 });
  }
}
