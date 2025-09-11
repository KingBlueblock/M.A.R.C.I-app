

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- SPIKE Prime BLE Service (Self-contained in this component) ---
const SPIKE_SERVICE_UUID = "00001623-1212-efde-1623-785feabcd123";
const SPIKE_CHARACTERISTIC_UUID = "00001624-1212-efde-1623-785feabcd123";

// Fix: Use 'any' type to avoid errors for missing Web Bluetooth API type definitions.
let spikeDevice: any | null = null;
// Fix: Use 'any' type to avoid errors for missing Web Bluetooth API type definitions.
let spikeCharacteristic: any | null = null;
let onConnectionChangeCallback: ((status: string) => void) | null = null;

const spikeService = {
  isConnected: () => !!spikeDevice && spikeDevice.gatt?.connected,

  connect: async (onConnectionChange: (status: string) => void) => {
    onConnectionChangeCallback = onConnectionChange;
    onConnectionChange("connecting");
    try {
      // Fix: Cast navigator to 'any' to access the experimental 'bluetooth' property.
      if (!(navigator as any).bluetooth) {
        throw new Error("Web Bluetooth is not supported in this browser.");
      }
      // Fix: Cast navigator to 'any' to access the experimental 'bluetooth' property.
      spikeDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [SPIKE_SERVICE_UUID] }],
      });

      if (!spikeDevice) {
        throw new Error("No device selected.");
      }
      
      spikeDevice.addEventListener('gattserverdisconnected', () => {
        spikeCharacteristic = null;
        if(onConnectionChangeCallback) onConnectionChangeCallback("disconnected");
      });

      const server = await spikeDevice.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server.");
      }
      
      const service = await server.getPrimaryService(SPIKE_SERVICE_UUID);
      spikeCharacteristic = await service.getCharacteristic(SPIKE_CHARACTERISTIC_UUID);

      if (onConnectionChangeCallback) onConnectionChangeCallback("connected");

    } catch (error: any) {
      console.error("Spike Connection Error:", error);
      if (onConnectionChangeCallback) onConnectionChangeCallback(`error: ${error.message}`);
    }
  },

  disconnect: () => {
    if (spikeDevice?.gatt?.connected) {
      spikeDevice.gatt.disconnect();
    }
  },

  sendCommand: async (command: object) => {
    if (!spikeCharacteristic) {
      console.warn("Cannot send command: not connected.");
      return;
    }
    try {
      const commandString = JSON.stringify(command) + '\r';
      const encoder = new TextEncoder();
      await spikeCharacteristic.writeValue(encoder.encode(commandString));
    } catch (error) {
      console.error("Error sending command:", error);
    }
  },

  motorStart: (port: string, speed: number) => {
    return spikeService.sendCommand({
      "m": "motor_start",
      "p": { "port": port, "speed": speed }
    });
  },

  motorStop: (port: string) => {
    return spikeService.sendCommand({
      "m": "motor_stop",
      "p": { "port": port }
    });
  },

  motorStartPair: (port1: string, port2: string, speed1: number, speed2: number) => {
     return spikeService.sendCommand({
      "m": "motor_start_pair",
      "p": { "port1": port1, "port2": port2, "speed1": speed1, "speed2": speed2 }
    });
  }
};
// --- End of Service ---

const JoyStick: React.FC<{ onMove: (x: number, y: number) => void }> = ({ onMove }) => {
    const knobRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!knobRef.current) return;
        const knob = knobRef.current;
        const rect = knob.parentElement!.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const maxDist = rect.width / 2 - knob.offsetWidth / 2;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        onMove(dx / maxDist, -dy / maxDist); // Invert Y-axis for intuitive control
    }, [onMove]);
    
    const handleEnd = useCallback(() => {
        if (!knobRef.current) return;
        isDragging.current = false;
        knobRef.current.style.transform = 'translate(0, 0)';
        onMove(0, 0);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    }, [onMove]);

    const onMouseMove = useCallback((e: MouseEvent) => handleMove(e.clientX, e.clientY), [handleMove]);
    const onTouchMove = useCallback((e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY), [handleMove]);
    const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);
    const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        isDragging.current = true;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
    };

    return (
        <div onMouseDown={handleStart} onTouchStart={handleStart} className="w-28 h-28 bg-black/30 rounded-full flex items-center justify-center cursor-pointer select-none">
            <div ref={knobRef} className="w-12 h-12 bg-[--accent-400] rounded-full border-2 border-black/50 pointer-events-none transition-transform duration-75"></div>
        </div>
    );
};


const SpikePrimeTab: React.FC = () => {
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [logs, setLogs] = useState<string[]>(['Welcome to Spike Prime Controller.']);

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 100));
    };

    useEffect(() => {
        addLog(`Status changed: ${connectionStatus}`);
    }, [connectionStatus]);
    
    const handleConnect = () => {
        spikeService.connect((status) => {
            setConnectionStatus(status);
        });
    };
    
    const handleDpad = (direction: 'F' | 'B' | 'L' | 'R' | 'S') => {
        switch(direction) {
            case 'F': spikeService.motorStartPair('A', 'B', -75, 75); addLog("Move Forward"); break;
            case 'B': spikeService.motorStartPair('A', 'B', 75, -75); addLog("Move Backward"); break;
            case 'L': spikeService.motorStartPair('A', 'B', -50, -50); addLog("Turn Left"); break;
            case 'R': spikeService.motorStartPair('A', 'B', 50, 50); addLog("Turn Right"); break;
            case 'S': spikeService.motorStop('A'); spikeService.motorStop('B'); addLog("Stop"); break;
        }
    };
    
    const handleLeftStickMove = (x: number, y: number) => {
        const speed = Math.round(y * 100);
        const turn = Math.round(x * 100);
        let leftSpeed = speed - turn;
        let rightSpeed = speed + turn;
        leftSpeed = Math.max(-100, Math.min(100, leftSpeed));
        rightSpeed = Math.max(-100, Math.min(100, rightSpeed));
        spikeService.motorStartPair('A', 'B', -leftSpeed, rightSpeed);
    };

    const handleRightStickMove = (x: number, y: number) => {
        spikeService.motorStart('C', Math.round(y * 100));
        spikeService.motorStart('D', Math.round(x * 100));
    };


    return (
        <div className="flex flex-col h-full items-center justify-center p-2">
            {/* Gamepad Body */}
            <div className="w-full max-w-2xl bg-slate-700/50 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50 flex flex-col items-center gap-4">
                {/* Top bar with status and connect button */}
                <div className="w-full flex justify-between items-center px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="font-semibold capitalize">{connectionStatus}</span>
                    </div>
                    <button onClick={handleConnect} disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'} className="bg-[--accent-500] text-white px-4 py-1.5 rounded-lg hover:bg-[--accent-400] disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-bold">
                        Connect
                    </button>
                </div>
                
                {/* Controller "Screen" */}
                <div className="w-full h-24 bg-black/50 rounded-lg p-2 font-mono text-xs text-green-400 overflow-y-auto border border-white/10">
                    {logs.map((log, i) => <p key={i} className={i === 0 ? 'text-white' : ''}>{log}</p>)}
                </div>
                
                {/* Main controls area */}
                <div className="w-full flex justify-between items-center">
                    {/* Left side: D-pad and Joystick */}
                    <div className="flex items-center gap-6">
                        <JoyStick onMove={handleLeftStickMove} />
                        <div className="grid grid-cols-3 grid-rows-3 w-24 h-24 gap-1">
                            <div/>
                            <button onMouseDown={() => handleDpad('F')} onMouseUp={() => handleDpad('S')} className="bg-black/40 rounded-t-md hover:bg-[--accent-500]">▲</button>
                            <div/>
                            <button onMouseDown={() => handleDpad('L')} onMouseUp={() => handleDpad('S')} className="bg-black/40 rounded-l-md hover:bg-[--accent-500]">◀</button>
                            <div className="bg-black/40"/>
                            <button onMouseDown={() => handleDpad('R')} onMouseUp={() => handleDpad('S')} className="bg-black/40 rounded-r-md hover:bg-[--accent-500]">▶</button>
                            <div/>
                            <button onMouseDown={() => handleDpad('B')} onMouseUp={() => handleDpad('S')} className="bg-black/40 rounded-b-md hover:bg-[--accent-500]">▼</button>
                            <div/>
                        </div>
                    </div>
                    {/* Right side: Joystick */}
                    <div className="flex items-center gap-6">
                         <JoyStick onMove={handleRightStickMove} />
                    </div>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-4 text-center max-w-md">Use the left joystick for driving (A+B motors). Use the right joystick for accessories (C+D motors). D-Pad provides simple movement commands.</p>
        </div>
    );
};

export default SpikePrimeTab;