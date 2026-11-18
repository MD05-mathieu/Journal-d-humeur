/**
 * Types partagés pour l'application mobile Wellness Journal
 */

// === Authentification ===
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  expiration: string;
}

// === Suivi de l'humeur ===
export interface MoodEntryRequest {
  score: number;
  emotionTags: string[];
  note?: string | null;
  entryDateUtc?: string;
}

export interface MoodEntryResponse {
  id: number;
  score: number;
  emotionTags: string[];
  note?: string | null;
  entryDateUtc: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionFrequency {
  emotion: string;
  count: number;
}

export interface WeeklySummaryResponse {
  entries: MoodEntryResponse[];
  averageScore: number;
  topEmotions: EmotionFrequency[];
  totalEntries: number;
  periodStart: string;
  periodEnd: string;
}

// === Typage Navigation ===
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
};
