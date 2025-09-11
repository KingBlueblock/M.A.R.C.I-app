// A simple wrapper for the Web Speech API's synthesis feature.

let currentUtterance: SpeechSynthesisUtterance | null = null;
let voices: SpeechSynthesisVoice[] = [];

interface TtsSettings {
    pitch: number;
    rate: number;
}

const defaultSettings: TtsSettings = { pitch: 1.2, rate: 1.0 };

/**
 * Retrieves TTS settings from localStorage, with a fallback to defaults.
 */
function getTtsSettings(): TtsSettings {
    try {
        const stored = localStorage.getItem('marci-tts-settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Could not parse TTS settings from localStorage:", e);
    }
    return defaultSettings;
}

/**
 * Saves partial or full TTS settings to localStorage.
 * @param settings An object with pitch and/or rate.
 */
export function setTtsSettings(settings: Partial<TtsSettings>) {
    try {
        const current = getTtsSettings();
        localStorage.setItem('marci-tts-settings', JSON.stringify({ ...current, ...settings }));
    } catch(e) {
        console.error("Could not save TTS settings to localStorage:", e);
    }
}


/**
 * Loads available voices from the browser's speech synthesis engine.
 */
function loadVoices() {
  if ('speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
  }
}

// Initial load of voices.
loadVoices();
// Update the voice list when it changes. This is crucial for some browsers.
if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Selects a suitable female voice from the available list.
 * It prioritizes higher-quality voices like Google's and has fallbacks.
 * @returns {SpeechSynthesisVoice | null} The selected voice, or null if none are found.
 */
const getFemaleVoice = (): SpeechSynthesisVoice | null => {
    // If voices are not loaded yet, try one more time.
    if (voices.length === 0) {
        loadVoices();
    }
    if (voices.length === 0) return null;

    // 1. Prioritize specific, high-quality voices by name
    const preferredVoice = voices.find(v => v.name === 'Google US English' && v.lang === 'en-US');
    if (preferredVoice) return preferredVoice;

    // 2. Fallback: find any voice that identifies as female in English.
    const femaleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
    if (femaleVoice) return femaleVoice;

    // 3. Fallback: find any US English voice (these are often female by default on many systems).
    const usVoice = voices.find(v => v.lang === 'en-US');
    if (usVoice) return usVoice;
    
    // 4. Last resort: return nothing and let the browser use its default.
    return null;
}

/**
 * Speaks the given text using the browser's TTS engine.
 * @param text The text to speak.
 * @param onEnd An optional callback function to execute when speech finishes.
 */
export const speak = (text: string, onEnd?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech Synthesis not supported by this browser.");
    onEnd?.();
    return;
  }
  
  // Stop any ongoing speech before starting a new one.
  stopSpeaking();
  
  // Clean the text to remove emojis and other symbols that are not read well.
  // This regex removes common emoji ranges. The 'u' flag is for unicode.
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  
  // Also remove some markdown-like symbols that might be read aloud.
  const symbolsToReplace = /[*_`~#]/g;

  const cleanedText = text
    .replace(emojiRegex, '')
    .replace(symbolsToReplace, '')
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single one
    .trim();

  // Don't speak if the cleaned text is empty
  if (!cleanedText) {
    onEnd?.();
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(cleanedText);

  const femaleVoice = getFemaleVoice();
  if (femaleVoice) {
      currentUtterance.voice = femaleVoice;
  }
  
  // Apply user-defined settings
  const settings = getTtsSettings();
  currentUtterance.rate = settings.rate;
  currentUtterance.pitch = settings.pitch;

  currentUtterance.onend = () => {
    onEnd?.();
    currentUtterance = null;
  };

  currentUtterance.onerror = (event) => {
    console.error("SpeechSynthesis Error:", event.error);
    alert(`Oops! Text-to-speech isn't working right now (error: ${event.error}). You can disable it in Settings if you'd like.`);
    onEnd?.(); // Ensure onEnd is called even if there's an error.
    currentUtterance = null;
  };
  
  window.speechSynthesis.speak(currentUtterance);
};

/**
 * Stops any currently active speech synthesis.
 */
export const stopSpeaking = () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (currentUtterance) {
        currentUtterance.onend = null; // Prevent onEnd from firing on cancel.
        currentUtterance = null;
    }
  }
};
