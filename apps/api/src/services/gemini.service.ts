import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Graceful fallback if no API key is provided during MVP development
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export class GeminiService {
  async getTextFeedback(prompt: string) {
    if (!ai) return "AI features are disabled because you have not configured GEMINI_API_KEY yet. Please add it to the .env file!";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    } catch (e: any) {
      console.error(e);
      throw new Error('Gemini generation failed');
    }
  }

  async analyzeRoutine(userId: string, currentRoutine: any) {
    const prompt = `You are a professional strength coach. Analyze this workout routine: ${JSON.stringify(currentRoutine)}. Provide exactly 3 bullet points on how to improve it.`;
    return this.getTextFeedback(prompt);
  }
}
export const geminiService = new GeminiService();
