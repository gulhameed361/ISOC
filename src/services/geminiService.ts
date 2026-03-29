import { GoogleGenAI, Type } from '@google/genai';

const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export async function parseTimetableImage(base64Image: string, mimeType: string) {
  if (!ai) {
    throw new Error(
      'Gemini API key is missing. Set VITE_GEMINI_API_KEY in your .env and rebuild.'
    );
  }

  const prompt = `
    Extract the prayer timetable from this image. This is likely a university or mosque prayer schedule.
    
    Look for a table with these typical columns:
    - Date/Day
    - Fajr (Athan & Iqama)
    - Sunrise
    - Dhuhr (Athan & Iqama) - on Fridays this is Jumu'ah
    - Asr (Athan & Iqama)
    - Maghrib (Athan & Iqama)
    - Isha (Athan & Iqama)
    
    Extract all days visible in the image.
    
    Rules:
    - If time shows "05:17 / 05:30": first is Athan, second is Iqama
    - If single time like "05:30": assume it's the Iqama
    - For merged cells, apply same time to all merged days
    - Dates should be in YYYY-MM-DD format (use current year)
    
    Return a JSON array with this exact structure:
    [
      {
        "dateStr": "2026-04-01",
        "prayers": [
          {"name": "Fajr", "athan": "05:17", "iqama": "05:30"},
          {"name": "Sunrise", "athan": "06:47", "iqama": "06:47"},
          {"name": "Dhuhr", "athan": "12:30", "iqama": "12:45"},
          {"name": "Asr", "athan": "16:00", "iqama": "16:15"},
          {"name": "Maghrib", "athan": "19:30", "iqama": "19:35"},
          {"name": "Isha", "athan": "21:00", "iqama": "21:15"}
        ]
      }
    ]
    
    Only include times you can clearly read. Skip rows where times are unreadable.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: prompt },
      { inlineData: { data: base64Image, mimeType: mimeType } },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dateStr: { type: Type.STRING },
            hijriDate: { type: Type.STRING },
            sunrise: { type: Type.STRING },
            prayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  athan: { type: Type.STRING },
                  iqama: { type: Type.STRING }
                },
                required: ["name", "athan", "iqama"]
              }
            }
          },
          required: ["dateStr", "prayers"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to parse image");
  }

  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error("Failed to parse AI response");
  }
}
