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
  Social = 'SOCIAL',
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

// --- Unified History Types ---

export enum HistoryItemType {
  Chat = 'CHAT',
  Image = 'IMAGE',
  MusicLyrics = 'MUSIC_LYRICS',
  StudyNotes = 'STUDY_NOTES',
  MinecraftAddon = 'MINECRAFT_ADDON',
}

export interface BaseHistoryItem {
  id: string;
  type: HistoryItemType;
  title: string;
  createdAt: number;
}

export interface ChatHistoryItem extends BaseHistoryItem {
  type: HistoryItemType.Chat;
  sessionId: string;
  category: string;
  isFavorited?: boolean;
  // Fix: Add 'prompt?: never' to satisfy the discriminated union's excess property check.
  // This makes 'prompt' a known key on all HistoryItem types, preventing errors when creating
  // other history items that *do* have a prompt.
  prompt?: never;
  // Fix: Add 'content?: never' to satisfy discriminated union checks for other history item types that have a 'content' property.
  content?: never;
}

export interface ImageHistoryItem extends BaseHistoryItem {
  type: HistoryItemType.Image;
  prompt: string;
  content: {
    imageUrl: string;
  };
  // Fix: Add chat-specific properties as optional 'never' types to satisfy discriminated union checks.
  sessionId?: never;
  category?: never;
  isFavorited?: never;
}

export interface MusicLyricsHistoryItem extends BaseHistoryItem {
  type: HistoryItemType.MusicLyrics;
  prompt: {
    topic: string;
    genre: string;
    mood: string;
  };
  content: {
    lyrics: string;
  };
  // Fix: Add chat-specific properties as optional 'never' types to satisfy discriminated union checks.
  sessionId?: never;
  category?: never;
  isFavorited?: never;
}

export interface StudyNotesHistoryItem extends BaseHistoryItem {
  type: HistoryItemType.StudyNotes;
  prompt: {
    topic: string;
  };
  content: {
    notes: string;
  };
  // Fix: Add chat-specific properties as optional 'never' types to satisfy discriminated union checks.
  sessionId?: never;
  category?: never;
  isFavorited?: never;
}

export interface MinecraftAddonHistoryItem extends BaseHistoryItem {
  type: HistoryItemType.MinecraftAddon;
  prompt: string;
  content: {
    files: Record<string, string>;
  };
  // Fix: Add chat-specific properties as optional 'never' types to satisfy discriminated union checks.
  sessionId?: never;
  category?: never;
  isFavorited?: never;
}

export type HistoryItem = ChatHistoryItem | ImageHistoryItem | MusicLyricsHistoryItem | StudyNotesHistoryItem | MinecraftAddonHistoryItem;