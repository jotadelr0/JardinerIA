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
  substrate: string; 
}

export interface PlantLog {
  id: string;
  type: 'watering' | 'blooming';
  date: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  imageUrl: string; 
  referenceImageUrl: string; 
  instructions: PlantCareInstructions;
  logs: PlantLog[];
  lastWateredAt?: string;
  addedAt: string;
  roomId: string; // ID de la habitación a la que pertenece
}

export type View = 'dashboard' | 'add-choice' | 'camera' | 'search' | 'plant-detail' | 'light-meter';