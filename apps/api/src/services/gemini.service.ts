
import axios from 'axios';

export class GeminiService {
  async getTextFeedback(prompt: string) {
    // Call Ollama running locally (e.g., llama3 or other model)
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3',
        prompt,
        stream: false
      });
      return response.data.response || response.data.text || "[No response from Ollama]";
    } catch (e: any) {
      console.error(e);
      throw new Error('Ollama generation failed');
    }
  }

  async analyzeRoutine(userId: string, currentRoutine: any) {
    const prompt = `You are a professional strength coach. Analyze this workout routine: ${JSON.stringify(currentRoutine)}. Provide exactly 3 bullet points on how to improve it.`;
    return this.getTextFeedback(prompt);
  }
}
export const geminiService = new GeminiService();
