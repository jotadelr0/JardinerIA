export interface PlantCareInstructions {
  commonName: string;
  scientificName: string;
  lightLevel: number; // 1 a 5
  waterLevel: number; // 1 a 5
  location: 'interior' | 'exterior';
  description: string;
  origin: string;
  homeClimateTips: string;
  recommendations: string;
  wateringWinter: number; // días entre riegos
  wateringSummer: number; // días entre riegos
  targetLumens: number;
  frequentProblems: string;
  fertilization: string;
  pruning: string;
  substrate: string; // Nuevo campo para consejos de sustrato
}

export interface PlantLog {
  id: string;
  type: 'watering' | 'blooming';
  date: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  imageUrl: string; // El dibujo line-art
  referenceImageUrl: string; // La foto realista
  instructions: PlantCareInstructions;
  logs: PlantLog[];
  lastWateredAt?: string;
  addedAt: string;
}

export type View = 'dashboard' | 'add-choice' | 'camera' | 'search' | 'plant-detail' | 'light-meter';