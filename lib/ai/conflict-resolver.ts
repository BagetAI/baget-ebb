import { CONFLICT_RESOLUTION_PROMPT } from './prompts';

export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
}

export interface EbbBlock {
  title: string;
  category: string;
  start_time: string;
  end_time: string;
}

export interface ConflictOption {
  id: string;
  label: string;
  action: string;
}

export interface ConflictProposal {
  conflict_summary: string;
  options: ConflictOption[];
  recommendation: string;
}

/**
 * AI Conflict Resolver
 * Analyzes a clash between a real calendar event and an Ebb Reset block.
 */
export async function resolveConflict(existingEvent: CalendarEvent, proposedBlock: EbbBlock): Promise<ConflictProposal> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback logic for local testing without API key
    return {
      conflict_summary: `Your "${existingEvent.title}" overlaps with your planned "${proposedBlock.title}".`,
      options: [
        { id: "reschedule", label: "Reschedule the work event", action: "Move it to the next available slot" },
        { id: "skip", label: "Skip Ebb block", action: "Prioritize the existing appointment" },
        { id: "buffer", label: "Add buffer", action: "Shorten both by 15 mins" }
      ],
      recommendation: "We recommend rescheduling the work event to protect your recovery foundations."
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: CONFLICT_RESOLUTION_PROMPT },
          { 
            role: "user", 
            content: `EXISTING EVENT:\n${JSON.stringify(existingEvent, null, 2)}\n\nPROPOSED EBB BLOCK:\n${JSON.stringify(proposedBlock, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) throw new Error("OpenAI API call failed");

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as ConflictProposal;

  } catch (error) {
    console.error("Conflict resolution failed:", error);
    return {
      conflict_summary: "A calendar overlap was detected.",
      options: [
        { id: "reschedule", label: "Reschedule", action: "Move to later" },
        { id: "skip", label: "Skip", action: "Keep current" },
        { id: "buffer", label: "Add buffer", action: "Squeeze both" }
      ],
      recommendation: "Prioritize sleep and recovery foundations."
    };
  }
}
