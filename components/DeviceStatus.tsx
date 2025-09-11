import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/geminiService';
import { IconWeather, IconBattery } from './Icons';

interface WeatherData {
    city: string;
    temperature: string;
    condition: string;
}

interface BatteryData {
    level: number;
    charging: boolean;
}

const DeviceStatus: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [battery, setBattery] = useState<BatteryData | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // --- Weather ---
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const weatherData = await getWeather(position.coords.latitude, position.coords.longitude);
                    setWeather(weatherData);
                } catch (e) {
                    console.error('Failed to get weather:', e);
                    setError('Could not fetch weather data.');
                }
            },
            (err) => {
                console.warn(`Geolocation error(${err.code}): ${err.message}`);
                setError('Location access denied. Cannot fetch weather.');
            },
            { timeout: 10000 }
        );

        // --- Network Status ---
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // --- Battery Status ---
        const updateBatteryStatus = (batteryManager: any) => {
            setBattery({
                level: Math.round(batteryManager.level * 100),
                charging: batteryManager.charging,
            });
        };

        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((batteryManager: any) => {
                updateBatteryStatus(batteryManager);
                batteryManager.addEventListener('levelchange', () => updateBatteryStatus(batteryManager));
                batteryManager.addEventListener('chargingchange', () => updateBatteryStatus(batteryManager));
            });
        }
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };

    }, []);

    const getStatusText = () => {
        if (error) return <span className="text-yellow-400">{error}</span>;
        if (!weather && !battery) return <span>Fetching system status...</span>;
        
        return (
             <div className="flex items-center gap-3">
                {weather && (
                    <span className="flex items-center gap-1.5" title={`${weather.condition} in ${weather.city}`}>
                        <IconWeather /> {weather.temperature}
                    </span>
                )}
                {battery && (
                     <span className="flex items-center gap-1.5" title={`Battery Status`}>
                        <IconBattery /> {battery.level}% {battery.charging ? '⚡' : ''}
                    </span>
                )}
                 <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500'}`} title={isOnline ? 'Online' : 'Offline'}></span>
            </div>
        )
    }

    return (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1 py-1 bg-black/5 dark:bg-white/5 rounded-md flex justify-center items-center">
           {getStatusText()}
        </div>
    );
};

export default DeviceStatus;
