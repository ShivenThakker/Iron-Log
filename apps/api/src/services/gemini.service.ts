import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultModel = 'gemini-2.0-flash';

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
}

export const geminiService = new GeminiService();
