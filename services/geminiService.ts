import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { PromptParts } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType
    },
  };
};

export const analyzeImageAndGeneratePrompt = async (image: { base64: string, mimeType: string }): Promise<PromptParts> => {
  const imagePart = fileToGenerativePart(image.base64, image.mimeType);

  const systemInstruction = `You are an expert in text-to-image prompt engineering. Analyze the provided image and generate a detailed, structured prompt suitable for AI image generators like Midjourney or Imagen. Your response must be a JSON object. The 'fullPrompt' should be a complete, coherent sentence combining all elements. The other fields should break down the prompt into its core components.`;
  
  const prompt = "Analyze this image and generate the prompt breakdown.";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [imagePart, { text: prompt }]
    },
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                scene: { type: Type.STRING, description: 'The main subject, object, or scene.' },
                background: { type: Type.STRING, description: 'The environment or background elements.' },
                imageType: { type: Type.STRING, description: 'Type of image (e.g., photograph, illustration, 3D render).' },
                style: { type: Type.STRING, description: 'Artistic style (e.g., photorealistic, impressionistic, surreal).' },
                texture: { type: Type.STRING, description: 'Visual texture details (e.g., glossy, matte, rough).' },
                lighting: { type: Type.STRING, description: 'Description of the lighting (e.g., soft cinematic lighting, dramatic sidelight).' },
                details: { type: Type.STRING, description: 'Additional specific details or keywords.' },
                fullPrompt: { type: Type.STRING, description: 'A complete, ready-to-use prompt combining all elements.' },
            }
        }
    }
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as PromptParts;
};

export const breakdownPromptIntoParts = async (prompt: string): Promise<PromptParts> => {
  const systemInstruction = `You are an expert in text-to-image prompt engineering. Analyze the provided prompt text and break it down into a structured JSON object. The 'fullPrompt' in the JSON response should be identical to the user's input prompt. The other fields should break down the prompt into its core components as best as you can. If a component is not present in the prompt, leave the corresponding field as an empty string.`;
  
  const userPrompt = `Analyze this prompt and generate the breakdown: "${prompt}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [{ text: userPrompt }]
    },
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                scene: { type: Type.STRING, description: 'The main subject, object, or scene.' },
                background: { type: Type.STRING, description: 'The environment or background elements.' },
                imageType: { type: Type.STRING, description: 'Type of image (e.g., photograph, illustration, 3D render).' },
                style: { type: Type.STRING, description: 'Artistic style (e.g., photorealistic, impressionistic, surreal).' },
                texture: { type: Type.STRING, description: 'Visual texture details (e.g., glossy, matte, rough).' },
                lighting: { type: Type.STRING, description: 'Description of the lighting (e.g., soft cinematic lighting, dramatic sidelight).' },
                details: { type: Type.STRING, description: 'Additional specific details or keywords.' },
                fullPrompt: { type: Type.STRING, description: 'The original user-provided prompt. This MUST be identical to the input.' },
            }
        }
    }
  });

  const jsonString = response.text.trim();
  const parsed = JSON.parse(jsonString) as PromptParts;
  // Ensure the fullPrompt is not modified by the AI, preserving the user's exact input.
  parsed.fullPrompt = prompt; 
  return parsed;
};


export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("Image generation failed.");
};


export const editImageWithPrompt = async (image: { base64: string, mimeType: string }, prompt: string): Promise<string> => {
    const imagePart = fileToGenerativePart(image.base64, image.mimeType);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("Image editing failed.");
};

export const createChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful AI assistant for a creative prompt engineering dashboard. Answer user questions concisely and clearly.',
        },
    });
};