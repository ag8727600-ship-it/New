import { GoogleGenAI } from "@google/genai";
import { EventType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const GeminiService = {
  suggestRecipe: async (ingredients: string): Promise<string> => {
    if (!ai) return "Erro: API Key não configurada.";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Crie uma receita de coquetel detalhada usando estes ingredientes (pode sugerir adicionais comuns): ${ingredients}. 
        Retorne em formato JSON com chaves: name, instructions, glassware, ingredients (array de objetos com name, amount, unit).`
      });
      return response.text;
    } catch (error) {
      console.error(error);
      return "Erro ao gerar receita.";
    }
  },

  generateEventChecklist: async (guests: number, type: EventType): Promise<string> => {
    if (!ai) return "[]";

    const prompt = `
      Atue como um gerente de bar experiente. Crie uma lista de verificação (checklist) detalhada para um evento do tipo "${type}" com ${guests} convidados.
      
      Retorne APENAS um JSON válido. O JSON deve ser um array de objetos.
      Cada objeto deve ter a estrutura:
      {
        "name": "Nome do item",
        "category": "Uma das opções exatas: 'Bebida', 'Insumo', 'Xarope', 'Vidraria', 'Utensilio', 'Estrutura', 'Animacao'",
        "quantityNeeded": numero (estimativa calculada para ${guests} pessoas),
        "notes": "Dica breve ou especificacao"
      }

      Inclua itens essenciais como:
      - Bebidas (Vodka, Whisky, Gin, Agua, Cerveja)
      - Insumos (Gelo, Frutas, Acucar)
      - Vidraria (Copos Long Drink, Tacas, Shots)
      - Utensilios (Coqueteleiras, Maceradores, Guardanapos)
      - Estrutura (Bar Movel, Lixeiras)
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      let text = response.text;
      // Remove markdown code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return text;
    } catch (error) {
      console.error("AI Error:", error);
      return "[]";
    }
  }
};