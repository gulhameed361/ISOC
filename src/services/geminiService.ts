import { GoogleGenAI, Type } from '@google/genai';

const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface ImageClassification {
  isPrayerTimetable: boolean;
  formatType: 'standard' | 'handwritten' | 'screenshot' | 'invalid';
  confidence: number;
  detectedDateRange?: { start: string; end: string };
  columnHeaders?: string[];
}

export async function classifyTimetableImage(base64Image: string, mimeType: string): Promise<ImageClassification> {
  if (!ai) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY in your .env and rebuild.');
  }

  const classifyPrompt = `
    Analyze this image and determine:
    1. Is this a prayer timetable?
    2. What format is it in?
    
    Look for these standard column headers that indicate a prayer timetable:
    - Date, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
    - Or variations like: Time, Fjr, Dhr, Asr, Mgh, Isha
    
    Also check for:
    - Athan/Iqama times for each prayer
    - Date columns with day numbers
    - University or mosque branding/headers
    
    Return a JSON object with these fields:
    - isPrayerTimetable: boolean (true if this is a prayer schedule)
    - formatType: "standard" | "handwritten" | "screenshot" | "invalid"
    - confidence: number (0-100)
    - detectedDateRange: { start: string, end: string } or null
    - columnHeaders: string[] or null (the detected column headers)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: classifyPrompt },
        { inlineData: { data: base64Image, mimeType } }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isPrayerTimetable: { type: Type.BOOLEAN },
          formatType: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          detectedDateRange: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING },
              end: { type: Type.STRING }
            }
          },
          columnHeaders: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["isPrayerTimetable", "formatType", "confidence"]
      }
    }
  });

  if (!response.text) {
    return {
      isPrayerTimetable: false,
      formatType: 'invalid',
      confidence: 0
    };
  }

  try {
    return JSON.parse(response.text);
  } catch {
    return {
      isPrayerTimetable: false,
      formatType: 'invalid',
      confidence: 0
    };
  }
}

async function extractFromStandardTemplate(base64Image: string, mimeType: string) {
  const templatePrompt = `
    This image appears to be a standard prayer timetable. Extract the data using the known template structure:
    
    Expected columns: Date, Fajr (Athan, Iqama), Sunrise, Dhuhr (Athan, Iqama), Asr (Athan, Iqama), Maghrib (Athan, Iqama), Isha (Athan, Iqama)
    
    For each row (each day):
    1. Extract the date (day number and month if visible)
    2. Extract Fajr Athan and Iqama times
    3. Extract Sunrise time
    4. Extract Dhuhr Athan and Iqama times (on Fridays this becomes Jumu'ah)
    5. Extract Asr Athan and Iqama times
    6. Extract Maghrib Athan and Iqama times
    7. Extract Isha Athan and Iqama times
    
    If a time cell shows a range like "05:17 / 05:30", the first time is Athan and second is Iqama.
    If a time cell shows a single time like "05:30", this is likely the Iqama time.
    
    Handle merged cells by applying the same time to all merged days.
    
    Return a JSON array of daily schedules.
  `;

  const response = await ai!.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: templatePrompt },
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
            dateStr: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
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

  return response.text ? JSON.parse(response.text) : null;
}

async function extractWithFullParsing(base64Image: string, mimeType: string) {
  const parsingPrompt = `
    Extract the prayer timetable from this image.
    The image contains a table with columns for Date, Fajr (Athan, Iqama), Sunrise, Dhuhr (Athan, Iqama), Asr (Athan, Iqama), Maghrib (Athan, Iqama), and Isha (Athan, Iqama).
    Note that some Iqama times might be merged across multiple days. If a cell is merged, apply that time to all corresponding days.
    Return the data as a JSON array of daily schedules.
  `;

  const response = await ai!.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: parsingPrompt },
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
            dateStr: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
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

  return response.text ? JSON.parse(response.text) : null;
}

export async function parseTimetableImage(base64Image: string, mimeType: string) {
  if (!ai) {
    throw new Error(
      'Gemini API key is missing. Set VITE_FIREBASE_API_KEY in your .env and rebuild.'
    );
  }

  const classification = await classifyTimetableImage(base64Image, mimeType);

  if (!classification.isPrayerTimetable || classification.confidence < 30) {
    throw new Error(
      'This does not appear to be a prayer timetable image. Please upload a clear image of the prayer schedule.'
    );
  }

  let result: any = null;

  if (classification.formatType === 'standard' && classification.confidence >= 70) {
    console.log('Using template extraction for standard format');
    result = await extractFromStandardTemplate(base64Image, mimeType);
  }

  if (!result || result.length === 0) {
    console.log('Falling back to full parsing');
    result = await extractWithFullParsing(base64Image, mimeType);
  }

  if (!result || result.length === 0) {
    throw new Error('Failed to extract data from the image. Please try again with a clearer photo.');
  }

  return result;
}
