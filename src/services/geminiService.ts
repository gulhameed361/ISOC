import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseTimetableImage(base64Image: string, mimeType: string) {
  const prompt = `
    Extract the prayer timetable from this image.
    The image contains a table with columns for Date, Fajr (Athan, Iqama), Sunrise, Dhuhr (Athan, Iqama), Asr (Athan, Iqama), Maghrib (Athan, Iqama), and Isha (Athan, Iqama).
    Note that some Iqama times might be merged across multiple days. If a cell is merged, apply that time to all corresponding days.
    Return the data as a JSON array of daily schedules.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType } }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dateStr: { type: Type.STRING, description: "Date in YYYY-MM-DD format. Assume the year and month from the image header if present, otherwise use current year/month." },
            hijriDate: { type: Type.STRING, description: "Hijri date if available, e.g., '12 Ramadan 1447'" },
            sunrise: { type: Type.STRING, description: "Sunrise time, e.g., '06:47'" },
            prayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Prayer name (Fajr, Dhuhr, Asr, Maghrib, Isha)" },
                  athan: { type: Type.STRING, description: "Athan time, e.g., '05:17'" },
                  iqama: { type: Type.STRING, description: "Iqama time, e.g., '05:30'" }
                },
                required: ["name", "athan", "iqama"]
              }
            }
          },
          required: ["dateStr", "hijriDate", "sunrise", "prayers"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to parse image");
  }

  return JSON.parse(response.text);
}
