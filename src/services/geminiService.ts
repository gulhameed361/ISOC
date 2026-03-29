import { GoogleGenAI } from '@google/genai';

const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface Prayer {
  name: string;
  athan: string;
  iqama: string;
}

export interface ParsedDay {
  dateStr: string;
  prayers: Prayer[];
}

export async function parseTimetableImage(base64Image: string, mimeType: string): Promise<ParsedDay[]> {
  if (!ai) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY in your .env and rebuild.');
  }

  const prompt = `You are extracting prayer times from an image of a prayer timetable.
  
Extract ALL days visible in the image. For each day, extract:

1. The date in format "YYYY-MM-DD" (e.g., "2026-04-01")
2. For each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha):
   - The Athan time
   - The Iqama time

IMPORTANT RULES:
- If a cell shows "05:17 / 05:30" = first is Athan (05:17), second is Iqama (05:30)
- If a cell shows only one time like "05:30" = this is likely the Iqama time, estimate Athan as 10-15 minutes before
- For Sunrise, if shown, include it as a prayer with same time for athan and iqama
- Return ONLY valid JSON array, no markdown, no explanation

Return this exact JSON structure:
[
  {
    "dateStr": "2026-04-01",
    "prayers": [
      {"name": "Fajr", "athan": "05:17", "iqama": "05:30"},
      {"name": "Dhuhr", "athan": "12:30", "iqama": "12:45"},
      {"name": "Asr", "athan": "16:00", "iqama": "16:15"},
      {"name": "Maghrib", "athan": "19:30", "iqama": "19:35"},
      {"name": "Isha", "athan": "21:00", "iqama": "21:15"}
    ]
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType: mimeType } },
      ],
    });

    const text = response.text?.trim() || '';
    
    // Remove markdown code blocks if present
    let jsonStr = text;
    if (text.startsWith('```json')) {
      jsonStr = text.slice(7);
    } else if (text.startsWith('```')) {
      jsonStr = text.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    console.log('Raw AI response:', jsonStr.substring(0, 500));

    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid response format');
    }

    // Normalize the data
    return parsed.map((day: any) => {
      const prayers: Prayer[] = [];
      
      if (Array.isArray(day.prayers)) {
        day.prayers.forEach((p: any) => {
          if (p.name && p.athan) {
            prayers.push({
              name: p.name,
              athan: p.athan,
              iqama: p.iqama || p.athan, // fallback
            });
          }
        });
      }
      
      return {
        dateStr: day.dateStr || '',
        prayers,
      };
    }).filter((day: ParsedDay) => day.prayers.length > 0);

  } catch (error) {
    console.error('Gemini parse error:', error);
    throw new Error(`Failed to parse image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
