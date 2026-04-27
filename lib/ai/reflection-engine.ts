import { DAILY_REFLECTION_PROMPT } from './prompts';

export interface ReflectionOption {
  id: string;
  label: string;
  score_impact: number;
}

export interface ReflectionCheckIn {
  message: string;
  options: ReflectionOption[];
  reflection_type: 'sleep' | 'growth' | 'overall';
}

/**
 * Generates a personalized daily reflection message for WhatsApp.
 */
export async function generateDailyReflection(profile: any, plan: any): Promise<ReflectionCheckIn> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      message: "evening. how was your adherence to the reset plan today?",
      options: [
        { id: "1", label: "protected my foundations", score_impact: 10 },
        { id: "2", label: "mostly followed it", score_impact: 6 },
        { id: "3", label: "reactive load took over", score_impact: 2 }
      ],
      reflection_type: "overall"
    };
  }

  // Identify today's blocks
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todaysBlocks = plan.blocks.filter((b: any) => b.day === dayName);

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
          { role: "system", content: DAILY_REFLECTION_PROMPT },
          { 
            role: "user", 
            content: JSON.stringify({ profile, todaysBlocks }) 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content) as ReflectionCheckIn;
    
    // Replace {{name}} placeholder if exists
    result.message = result.message.replace('{{name}}', profile.user_id.split('_')[0]); // Simple fallback

    return result;
  } catch (error) {
    console.error("Reflection generation failed:", error);
    return {
      message: "evening. how would you rate your plan adherence today?",
      options: [
        { id: "1", label: "perfect adherence", score_impact: 10 },
        { id: "2", label: "some leakage", score_impact: 5 },
        { id: "3", label: "lost control", score_impact: 0 }
      ],
      reflection_type: "overall"
    };
  }
}
