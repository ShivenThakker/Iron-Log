
import axios from 'axios';

export class GeminiService {
  private readonly ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

  async getTextFeedback(prompt: string) {
    try {
      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt,
        stream: false
      }, {
        timeout: 30000
      });
      return response.data.response || response.data.text || "[No response from Ollama]";
    } catch (e: any) {
      const reason = e?.response?.data?.error || e?.message || 'Unknown Ollama error';
      throw new Error(`Ollama generation failed: ${reason}`);
    }
  }

  async analyzeRoutine(userId: string, currentRoutine: any) {
    const prompt = `You are a professional strength coach. Analyze this workout routine: ${JSON.stringify(currentRoutine)}. Provide exactly 3 bullet points on how to improve it.`;
    return this.getTextFeedback(prompt);
  }
}
export const geminiService = new GeminiService();
