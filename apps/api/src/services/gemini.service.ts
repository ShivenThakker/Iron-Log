import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface ParsedExerciseItem {
  name: string;
  target_sets: number;
  target_reps: string;
  rest_seconds?: number;
}

export interface ParsedDayItem {
  day_name: string;
  exercises: ParsedExerciseItem[];
}

export interface ParsedWorkoutPlan {
  program_name: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  schedule_days_per_week?: number;
  description?: string;
  days: ParsedDayItem[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private getModel(systemInstruction?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!this.genAI && apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    if (!this.genAI) {
      return null;
    }

    return this.genAI.getGenerativeModel({
      model: this.defaultModel,
      systemInstruction: systemInstruction || 'You are IronLog AI, an expert strength and conditioning coach and nutritionist. Provide concise, evidence-based, motivating advice. Focus on progressive overload, proper recovery, and sustainable nutrition.',
    });
  }

  async getTextFeedback(prompt: string, history: ChatMessage[] = []): Promise<string> {
    const model = this.getModel();
    if (!model) {
      return 'IronLog AI is in offline demo mode. Set GEMINI_API_KEY in your environment to enable real-time Gemini 2.0 Flash coaching responses.';
    }

    try {
      if (history.length > 0) {
        const chat = model.startChat({
          history: history.map((h) => ({
            role: h.role,
            parts: [{ text: h.parts }],
          })),
        });
        const result = await chat.sendMessage(prompt);
        return result.response.text();
      }

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error?.message || error);
      throw new Error(`AI generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async analyzeRoutine(userId: string, currentRoutine: any): Promise<string> {
    const systemPrompt = 'You are a professional strength and conditioning coach. Analyze the workout routine and provide exactly 3 actionable bullet points on how to improve progressive overload, muscle balance, and recovery.';
    const model = this.getModel(systemPrompt);

    if (!model) {
      return '• Focus on gradual weight increases (2.5kg)\n• Balance push and pull volume across the week\n• Ensure 48 hours recovery before training the same muscle group';
    }

    const prompt = `Analyze this user workout routine:\n${JSON.stringify(currentRoutine, null, 2)}`;
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('Routine analysis failed:', error?.message || error);
      return '• Prioritize progressive overload by adding 1 rep or small weight next session\n• Ensure full range of motion on compound lifts\n• Maintain 1-2 RIR (reps in reserve) on working sets';
    }
  }

  async generatePlan(profile: any, preferences: any): Promise<string> {
    const systemPrompt = `You are an elite fitness program designer. Generate a personalized training split in valid JSON format.
Include:
- program_name
- split_type
- description
- weekly_schedule: array of days with workout names and muscle focus
- workouts: array of workouts with name and exercises (exercise_name, target_sets, target_reps, target_rpe)`;

    const model = this.getModel(systemPrompt);
    if (!model) {
      return JSON.stringify({
        program_name: 'Custom Foundation Hypertrophy',
        split_type: 'Upper / Lower',
        description: 'Balanced 4-day split emphasizing compound lifts and progressive overload.',
        weekly_schedule: [
          { day: 'Day 1', workout: 'Upper Body A', focus: 'Chest, Back, Arms' },
          { day: 'Day 2', workout: 'Lower Body A', focus: 'Quads, Hamstrings, Calves' },
          { day: 'Day 3', workout: 'Rest', focus: 'Recovery' },
          { day: 'Day 4', workout: 'Upper Body B', focus: 'Shoulders, Back, Arms' },
          { day: 'Day 5', workout: 'Lower Body B', focus: 'Glutes, Hamstrings, Core' },
          { day: 'Day 6', workout: 'Rest', focus: 'Recovery' },
          { day: 'Day 7', workout: 'Rest', focus: 'Recovery' },
        ],
      });
    }

    const prompt = `User Profile:\n${JSON.stringify(profile, null, 2)}\nPreferences:\n${JSON.stringify(preferences, null, 2)}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async parseWorkoutPlanFromInput(input: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  }): Promise<ParsedWorkoutPlan> {
    const systemPrompt = `You are an elite strength and conditioning coach and AI workout program parser.
Your task is to take workout notes, documents, whiteboard text, or photos/screenshots of a workout sheet and parse them into a structured training routine JSON.

CRITICAL: Return ONLY a raw JSON object (valid JSON, no conversational text, no markdown backticks, no explanations) adhering to this schema:
{
  "program_name": "string (descriptive program name, e.g. 4-Day Upper Lower Split)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "schedule_days_per_week": number,
  "description": "string",
  "days": [
    {
      "day_name": "string (e.g. Day 1 - Push, or Monday - Chest & Triceps)",
      "exercises": [
        {
          "name": "string (e.g. Incline Bench Press)",
          "target_sets": number (default 3 if not specified),
          "target_reps": "string (e.g. 8-12, 10, or AMRAP)",
          "rest_seconds": number (default 90 if not specified)
        }
      ]
    }
  ]
}
If information like sets or reps is missing for an exercise, use sensible defaults (3 sets, 8-12 reps, 90s rest).
If days are not explicitly named, label them Day 1, Day 2, etc.`;

    const model = this.getModel(systemPrompt);

    if (!model) {
      const defaultDays: ParsedDayItem[] = [
        {
          day_name: 'Push Day (Chest, Shoulders, Triceps)',
          exercises: [
            { name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
            { name: 'Incline Bench Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
            { name: 'Dumbbell Overhead Press', target_sets: 3, target_reps: '10', rest_seconds: 90 },
            { name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
          ],
        },
        {
          day_name: 'Pull Day (Back, Biceps)',
          exercises: [
            { name: 'Lat Pulldown', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
            { name: 'Seated Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
            { name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '12', rest_seconds: 60 },
            { name: 'Hammer Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
          ],
        },
        {
          day_name: 'Legs & Core',
          exercises: [
            { name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
            { name: 'Romanian Deadlifts', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
            { name: 'Leg Curl Machine', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
            { name: 'Flat Bench Crunches', target_sets: 3, target_reps: '15-20', rest_seconds: 45 },
          ],
        },
      ];

      return {
        program_name: input.text ? input.text.slice(0, 30).trim() : 'Custom Parsed Routine',
        difficulty: 'intermediate',
        schedule_days_per_week: 3,
        description: 'Auto-parsed workout plan (Demo Mode). Set GEMINI_API_KEY to enable live Gemini 2.5 Flash parsing.',
        days: defaultDays,
      };
    }

    try {
      const parts: any[] = [];
      const userPrompt = input.text
        ? `Here is the workout plan notes/document to parse:\n\n${input.text}`
        : 'Please parse the workout schedule in the attached image/screenshot into the structured program JSON.';

      parts.push(userPrompt);

      if (input.imageBase64) {
        const cleanBase64 = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: input.mimeType || 'image/jpeg',
          },
        });
      }

      const result = await model.generateContent(parts);
      const textResponse = result.response.text();

      const cleaned = textResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned) as ParsedWorkoutPlan;
      return parsed;
    } catch (err: any) {
      console.error('Failed to parse plan via Gemini:', err?.message || err);
      throw new Error(`AI plan parsing failed: ${err?.message || 'Invalid format'}`);
    }
  }
}

export const geminiService = new GeminiService();
