import React from 'react';

interface SocialTabProps {
    onStartChat: (username: string) => void;
}

const AI_USERS = [
    { username: 'Alex', avatar: '🧑‍💻', bio: 'Tech enthusiast & gamer. Always down to talk about the latest gadgets or game releases.' },
    { username: 'Bella', avatar: '🎨', bio: 'Artist and dreamer. Loves discussing art history, painting techniques, and creative ideas.' },
    { username: 'Charlie', avatar: '🎵', bio: 'Musician and coffee aficionado. Let\'s chat about anything from classic rock to jazz fusion.' },
    { username: 'Diana', avatar: '📚', bio: 'Bookworm and history buff. Ask me about my latest read or any historical period!' },
    { username: 'Ethan', avatar: '✈️', bio: 'Traveler and photographer. I have stories from all over the world. Where should I go next?' },
    { username: 'Fiona', avatar: '🌿', bio: 'Gardener and nature lover. Happy to share tips on plants, hiking, and conservation.' },
];


const SocialTab: React.FC<SocialTabProps> = ({ onStartChat }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4">
                <h2 className="text-2xl font-orbitron text-[--accent-300]">Connect</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Start a conversation with one of our AI personas.
                </p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {AI_USERS.map((user, index) => (
                    <div
                        key={user.username}
                        className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors group animate-list-item-in"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{user.avatar}</span>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{user.username}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.bio}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onStartChat(user.username)}
                            className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors font-semibold"
                        >
                            Chat
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SocialTab;