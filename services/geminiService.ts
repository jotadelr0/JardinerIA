import { GoogleGenAI, Type } from "@google/genai";
import { PlantCareInstructions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const PLANT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING },
    scientificName: { type: Type.STRING },
    lightLevel: { type: Type.INTEGER, description: "Nivel de luz de 1 a 5" },
    waterLevel: { type: Type.INTEGER, description: "Nivel de riego de 1 a 5" },
    location: { type: Type.STRING, enum: ["interior", "exterior"] },
    description: { type: Type.STRING, description: "Breve resumen de la planta" },
    origin: { type: Type.STRING, description: "Origen geográfico y hábitat natural" },
    homeClimateTips: { type: Type.STRING, description: "Cómo replicar su clima natural en casa (humedad, temp)" },
    recommendations: { type: Type.STRING, description: "Consejos de reproducción y cuidados extra" },
    wateringWinter: { type: Type.INTEGER, description: "Días recomendados entre riegos durante el invierno" },
    wateringSummer: { type: Type.INTEGER, description: "Días recomendados entre riegos durante el verano" },
    targetLumens: { type: Type.INTEGER, description: "Lúmenes óptimos para esta planta" },
    frequentProblems: { type: Type.STRING, description: "Detalle de plagas, problemas comunes o cuidados críticos" },
    fertilization: { type: Type.STRING, description: "Consejos sobre cuándo y con qué abonar la planta" },
    pruning: { type: Type.STRING, description: "Consejos sobre cómo y cuándo podar para un crecimiento sano" },
    substrate: { type: Type.STRING, description: "Consejos sobre el tipo de tierra o sustrato ideal (drenaje, pH, componentes)" }
  },
  required: [
    "commonName", "scientificName", "lightLevel", "waterLevel", "location", 
    "description", "origin", "homeClimateTips", "recommendations", 
    "wateringWinter", "wateringSummer", "targetLumens", "frequentProblems",
    "fertilization", "pruning", "substrate"
  ]
};

export const identifyPlantByImage = async (base64Image: string): Promise<PlantCareInstructions> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Identifica esta planta y devuelve sus cuidados detallados, incluyendo días específicos de riego por estación, lúmenes, problemas frecuentes, abono, poda y el SUSTRATO ideal, en ESPAÑOL según el esquema." }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: PLANT_SCHEMA
    }
  });
  return JSON.parse(response.text);
};

export const searchPlantByName = async (name: string): Promise<PlantCareInstructions> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      parts: [{ text: `Busca información botánica sobre "${name}". Necesito origen, clima doméstico, recomendaciones de reproducción, frecuencia de riego (invierno/verano), lúmenes, problemas frecuentes, abono, poda y el SUSTRATO ideal. Todo en ESPAÑOL según el esquema.` }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: PLANT_SCHEMA
    }
  });
  return JSON.parse(response.text);
};

export const generateLineArt = async (plantName: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      parts: [{
        text: `Minimalist thin black line art drawing of a ${plantName} plant in a simple pot. White background, high contrast, clean vector lines, no shading.`
      }]
    }],
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return "";
};

export const generateReferencePhoto = async (plantName: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      parts: [{
        text: `A high-quality, photorealistic botanical studio photo of a perfectly healthy and lush ${plantName} plant. Natural bright soft lighting, neutral minimalist background, professional macro photography style.`
      }]
    }],
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return "";
};