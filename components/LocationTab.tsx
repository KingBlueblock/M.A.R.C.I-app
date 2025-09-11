import React, { useState, useEffect } from 'react';
import { IconLocation, IconDirections } from './Icons';

const LocationTab: React.FC = () => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');

    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setOrigin(`${latitude},${longitude}`);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationError('Could not get your location. Please check browser permissions and try again.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleGetDirections = () => {
        if (!destination) {
            setLocationError('Please enter a destination.');
            return;
        }
        const mapsUrl = new URL('https://www.google.com/maps/dir/');
        mapsUrl.searchParams.append('api', '1');
        if (origin) {
            mapsUrl.searchParams.append('origin', origin);
        }
        mapsUrl.searchParams.append('destination', destination);
        
        window.open(mapsUrl.toString(), '_blank');
    };

    return (
        <div className="flex flex-col h-full max-w-lg mx-auto">
            <div className="space-y-4">
                <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Starting Point (Origin)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="origin"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="Address, city, or coordinates"
                            className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                        />
                        <button 
                            onClick={handleUseCurrentLocation} 
                            disabled={isLocating}
                            className="p-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50"
                            title="Use my current location"
                        >
                            <IconLocation />
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Destination
                    </label>
                    <input
                        type="text"
                        id="destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter where you want to go"
                        className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                    />
                </div>

                {locationError && (
                    <p className="text-sm text-red-400">{locationError}</p>
                )}

                <div>
                    <button 
                        onClick={handleGetDirections}
                        disabled={!destination}
                        className="w-full flex items-center justify-center gap-2 bg-[--accent-500] text-white font-bold px-4 py-3 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <IconDirections />
                        Get Directions
                    </button>
                </div>
            </div>
             <div className="mt-8 text-center text-gray-400">
                <IconLocation />
                <p className="text-sm mt-2">Directions will open in a new tab.</p>
            </div>
        </div>
    );
};

export default LocationTab;