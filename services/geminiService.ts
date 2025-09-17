import { GoogleGenAI, Chat, Type } from "@google/genai";
import { ChatMessage, Task, Note } from '../types';

let ai: GoogleGenAI;

/**
 * Lazily initializes and returns the GoogleGenAI instance.
 * This prevents the app from crashing on load if the API key is not yet available.
 */
const getAi = (): GoogleGenAI => {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set. Gemini API calls will fail.");
            // We proceed, but the GenAI constructor will likely throw an error when used.
            // This is better than crashing the entire application load.
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    }
    return ai;
};

/**
 * A centralized handler for API errors to provide user-friendly messages.
 * @param error The error object caught.
 * @param context A string describing the action that failed (e.g., "generating image").
 * @returns A user-friendly error message string.
 */
const handleApiError = (error: unknown, context: string): string => {
  console.error(`Error in ${context}:`, error);
  if (error instanceof Error) {
    if (error.message.includes('API_KEY')) {
      return "My core systems are reporting an authentication error. The API key might be invalid. Please alert the administrator.";
    }
    if (error.message.includes('429')) { // Too Many Requests
      return "I'm experiencing high traffic right now! Please wait a moment and try again.";
    }
    if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch')) {
        return "I can't seem to connect to my creative core. Please check your internet connection.";
    }
    if (error.message.includes('SAFETY')) {
        return `My safety protocols were triggered for the ${context.toLowerCase()}. Please try a different prompt.`;
    }
    // A more generic message that still includes some detail
    return `An unexpected issue occurred while ${context.toLowerCase()}: ${error.message}`;
  }
  return `An unknown error occurred while ${context.toLowerCase()}. Please try again.`;
};

/**
 * Robustly extracts a JSON object from a string, which might contain markdown code fences.
 * @param text The text containing the JSON.
 * @returns The parsed JSON object.
 * @throws An error if no valid JSON is found.
 */
const extractJson = (text: string): any => {
    // Look for JSON inside markdown code blocks or as a standalone object/array.
    const match = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*}|\[[\s\S]*])/);
    if (match) {
        // Use the first capturing group if it's from a markdown block, otherwise use the second.
        const jsonStr = match[1] || match[2];
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse extracted JSON:", jsonStr, e);
            throw new Error("The response format was invalid. I couldn't understand the structure.");
        }
    }
    console.error("No JSON found in text:", text);
    throw new Error("No valid information found in the response.");
};


export const initChat = (systemInstruction: string): Chat => {
  return getAi().chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const getFunFact = async (): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Tell me a surprising and fun fact about technology or space.',
            config: {
                thinkingConfig: { thinkingBudget: 0 } // For faster response
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(handleApiError(error, "fetching a fun fact"));
    }
}

export const getEmojiRiddle = async (): Promise<{ riddle: string, answer: string }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Create a clever and challenging emoji-only riddle about a common object, movie, or concept. Provide the answer separately.',
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riddle: { type: Type.STRING, description: "The riddle using only emojis." },
                        answer: { type: Type.STRING, description: "The answer to the riddle." },
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "fetching an emoji riddle"));
    }
}

export const getEmojiFusion = async (emoji1: string, emoji2: string): Promise<{ name: string, emoji: string, description: string }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Creatively fuse these two emojis: ${emoji1} and ${emoji2}. Give the fused concept a new name, a new single emoji that represents it, and a short, fun description.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        emoji: { type: Type.STRING },
                        description: { type: Type.STRING },
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "fusing emojis"));
    }
};

export const getTicTacToeMove = async (board: (string | null)[]): Promise<{ move: number }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are playing Tic Tac Toe. The current board is represented by this array: ${JSON.stringify(board)}. 'X' is the human player, 'O' is you (the AI). It's your turn. Your priorities are: 1. Win if you have a winning move. 2. Block the opponent if they are about to win. 3. Take the center square if available. 4. Take a corner square. 5. Take any remaining side square. Based on these priorities, return the board index (0-8) of the single best move for 'O'.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        move: { type: Type.INTEGER },
                    },
                },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "getting Tic Tac Toe move"));
    }
};

export const generateLyrics = async (topic: string, genre: string, mood: string): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write song lyrics about "${topic}". The genre should be ${genre} and the mood should be ${mood}. Include sections like [Verse 1], [Chorus], [Verse 2], [Bridge], and [Outro].`,
        });
        return response.text;
    } catch (error) {
        throw new Error(handleApiError(error, "generating lyrics"));
    }
};

export const generateInstrumentalIdea = async (description: string): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on this song description: "${description}", describe a detailed instrumental arrangement. Mention specific instruments, tempo, key, and the overall structure and feeling of the music. For example, "A slow, melancholic piano melody in C minor..."`,
        });
        return response.text;
    } catch (error) {
        throw new Error(handleApiError(error, "generating an instrumental idea"));
    }
};


export const generateImage = async (prompt: string): Promise<string> => {
    try {
      const response = await getAi().models.generateImages({
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
      throw new Error("The image couldn't be generated, possibly due to safety filters. Please adjust your prompt.");
    } catch (error) {
        throw new Error(handleApiError(error, "generating an image"));
    }
  };

export const analyzeMood = async (text: string): Promise<{ mood: string }> => {
    if (!text) throw new Error("No text provided for mood analysis.");
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the mood of the following text and classify it into one of these categories: [Happy, Calm, Focused, Energetic, Default]. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mood: { type: Type.STRING },
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "analyzing mood"));
    }
};

export const generateStudyNotes = async (topic: string): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate comprehensive, well-structured study notes on the topic: "${topic}". Use markdown for formatting, including headings, subheadings, bold text for key terms, and bullet points for lists. The notes should be detailed and easy to understand for a student.`,
        });
        return response.text;
    } catch (error) {
        throw new Error(handleApiError(error, "generating study notes"));
    }
};

export const generatePptxContent = async (topic: string): Promise<{ title: string, slides: Array<{ title: string, points: string[], notes: string }> }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create content for a 5-slide presentation on the topic: "${topic}". Provide a main title for the presentation. For each slide, provide a slide title, 3-4 bullet points (as an array of strings), and detailed speaker notes.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        slides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    notes: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "generating presentation content"));
    }
};

export const categorizeChat = async (history: ChatMessage[]): Promise<{ title: string; category: string } | null> => {
    if (history.length === 0) return null;

    const conversationText = history.map(msg => `${msg.sender === 'user' ? 'User' : 'Marci'}: ${msg.text}`).join('\n');

    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following conversation, generate a short, relevant title (less than 5 words) and pick one category from this list: [Productivity, Creative, Learning, Casual]. Conversation: \n\n${conversationText}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result;
    } catch (error) {
        // This is a background task, so fail gracefully without alerting the user.
        console.error("Error categorizing chat:", error); 
        return { title: 'Chat Summary', category: 'General' };
    }
};

export const generateFullMinecraftAddon = async (prompt: string): Promise<Record<string, string>> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert Minecraft Bedrock Edition Add-on developer. Based on the user's detailed prompt, generate all necessary files for a complete .mcaddon.
- Create a unique, snake_case identifier for all custom entities, items, etc., based on the user's prompt.
- Generate file content as strings within a single JSON object.
- The keys of the JSON object should be the full file paths (e.g., "behavior_pack/entities/my_mob.json").
- Necessary files often include:
  - behavior_pack/manifest.json
  - behavior_pack/entities/your_entity.json
  - (if items are requested) behavior_pack/items/your_item.json
  - resource_pack/manifest.json
  - resource_pack/entity/your_entity.entity.json
  - resource_pack/texts/en_US.lang
- Ensure all JSON is valid and all UUIDs are unique (use placeholders like "<UUID1>", "<UUID2>", etc.).
- Do not include any text, explanations, or markdown formatting outside of the main JSON object.

User Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    description: "An object where keys are file paths and values are file contents.",
                    properties: {},
                    additionalProperties: { type: Type.STRING },
                },
            },
        });
        let jsonString = response.text.trim();
        
        // Replace UUID placeholders to ensure addon works
        const uuids = [...jsonString.matchAll(/<UUID\d*>/g)];
        if (uuids.length > 0) {
            let tempJsonString = jsonString;
            // Use a Set to ensure we replace each unique placeholder with a unique UUID
            new Set(uuids.map(u => u[0])).forEach(placeholder => {
                tempJsonString = tempJsonString.split(placeholder).join(crypto.randomUUID());
            });
            jsonString = tempJsonString;
        }

        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "generating Minecraft addon"));
    }
};

export const editMinecraftFile = async (fileContent: string, instruction: string): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert Minecraft Bedrock Edition Add-on developer. The user has provided a JSON file and an instruction. Modify the JSON file according to the instruction and return only the raw, updated JSON content. Do not add explanations or markdown.

Instruction: "${instruction}"

Original JSON file:
\`\`\`json
${fileContent}
\`\`\``,
        });

        return extractJson(response.text);
    } catch (error) {
        throw new Error(handleApiError(error, "editing Minecraft file"));
    }
};


export const getSongRecommendation = async (artists: string[]): Promise<{ song: string, artist: string, spotifyTrackId: string }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on these favorite artists: ${artists.join(', ')}, recommend one song of the day. Provide the song title, artist name, and the official Spotify Track ID.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        song: { type: Type.STRING },
                        artist: { type: Type.STRING },
                        spotifyTrackId: { type: Type.STRING, description: "The official track ID from Spotify." },
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "getting song recommendation"));
    }
};

export const getWeather = async (latitude: number, longitude: number): Promise<{ temperature: string, condition:string, city: string }> => {
  try {
    const response = await getAi().models.generateContent({
       model: "gemini-2.5-flash",
       contents: `What is the current weather in latitude ${latitude}, longitude ${longitude}? Respond with only a JSON object with keys "city", "temperature" (string with unit, e.g. "21°C"), and "condition" (e.g. "Sunny"). Do not include any other text or markdown formatting.`,
       config: {
         tools: [{googleSearch: {}}],
       },
    });
    
    return extractJson(response.text);

  } catch (error) {
    throw new Error(handleApiError(error, "getting weather"));
  }
};


export const getAiUserResponse = async (message: string, persona: string): Promise<string> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are acting as a user in a chat application. Your username is '${persona}'. The other user just sent this message: "${message}". Write a short, casual, and believable reply.`,
            config: {
                 thinkingConfig: { thinkingBudget: 0 } // For faster response
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(handleApiError(error, "getting AI user response"));
    }
};

export const getProactiveSuggestion = async (): Promise<string> => {
    try {
        const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `It's the ${timeOfDay}. Generate a single, short, friendly, and proactive suggestion or greeting for the user of an AI assistant app. Suggest a fun activity from the app (like generating an image, creating a song, or getting a fun fact). Keep it under 20 words. Example: "Good morning! How about we create a song in the Music Studio today?"`,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text;
    } catch (error) {
        console.warn("Couldn't fetch proactive suggestion:", error);
        return "Ready for anything! What's our plan?";
    }
}

export const getThemeSuggestion = async (context: string, themeNames: string[]): Promise<{ themeName: string, reason: string }> => {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's recent activity ("${context}"), suggest a color theme that fits the mood.
            Available themes: ${themeNames.join(', ')}.
            Provide a very short, friendly reason for the suggestion.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        themeName: { type: Type.STRING, description: `One of the available theme names.` },
                        reason: { type: Type.STRING, description: "A short, user-facing reason for the suggestion." },
                    }
                },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(handleApiError(error, "getting a theme suggestion"));
    }
};
