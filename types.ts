export enum Tab {
  Home = 'HOME',
  Productivity = 'PRODUCTIVITY',
  Creative = 'CREATIVE',
  Study = 'STUDY',
  Games = 'GAMES',
  Tools = 'TOOLS',
  History = 'HISTORY',
  Settings = 'SETTINGS',
  Admin = 'ADMIN',
  Chat = 'CHAT', // Special case for tab change logic.
}

export enum AvatarState {
  Idle = 'IDLE',
  Listening = 'LISTENING',
  Speaking = 'SPEAKING',
  Thinking = 'THINKING',
  Happy = 'HAPPY',
}

export enum Theme {
    Dark = 'DARK',
    Light = 'LIGHT'
}

export enum Mood {
  Default = 'DEFAULT',
  Happy = 'HAPPY',
  Calm = 'CALM',
  Focused = 'FOCUSED',
  Energetic = 'ENERGETIC',
}

export interface MoodTheme {
  '--accent-100': string;
  '--accent-200': string;
  '--accent-300': string;
  '--accent-400': string;
  '--accent-500': string;
  '--shadow-color': string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
}

export interface ChatMessage {
  sender: 'user' | 'marci';
  text: string;
  timestamp?: number;
  isEphemeral?: boolean;
  imageUrl?: string;
  isUserChatReply?: boolean;
  senderName?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  category: string;
  createdAt: number;
  history: ChatMessage[];
  participants?: string[];
}

export interface UserProfile {
  username: string;
  avatar: string; // Using a string for emoji or a simple identifier
  favoriteArtists: string[];
}

export interface BroadcastMessage {
  id: number;
  text: string;
  timestamp: number;
}

export type SocialIcon = 'twitter' | 'github' | 'discord' | 'website' | 'youtube' | 'instagram';

export interface SocialLink {
    id: number;
    icon: SocialIcon;
    url: string;
}

export interface TermsContent {
    title: string;
    content: string;
}