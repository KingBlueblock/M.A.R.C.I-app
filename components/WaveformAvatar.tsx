import React, { useRef, useEffect } from 'react';
import { AvatarState } from '../types';

interface WaveformAvatarProps {
  state: AvatarState;
}

const WaveformAvatar: React.FC<WaveformAvatarProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  const stateChangeTime = useRef(Date.now());
  const particles = useRef<any[]>([]);


  useEffect(() => {
    if (state) {
        stateChangeTime.current = Date.now();
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const resizeCanvas = () => {
      const { devicePixelRatio: ratio = 1 } = window;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.scale(ratio, ratio);
        particles.current = []; // Reset particles on resize
      }
    };
    
    const createParticles = (width: number, height: number) => {
        if (particles.current.length > 0) return;
        const numParticles = Math.floor(width / 30);
        for (let i = 0; i < numParticles; i++) {
            particles.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.2 + 0.3
            });
        }
    }

    const draw = () => {
      resizeCanvas();
      frameCount++;

      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-400').trim() || 'cyan';
      const accentColor2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-200').trim() || 'lightblue';

      // AURA: Draw Particles
      createParticles(width, height);
      ctx.fillStyle = accentColor2;
      ctx.globalAlpha = 0.4;
      particles.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Waveform
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, accentColor2);
      gradient.addColorStop(0.5, accentColor);
      gradient.addColorStop(1, accentColor2);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = accentColor;
      
      const lineCount = 60;
      const segmentWidth = width / lineCount;
      const centerY = height / 2;
      
      // Pop effect on state change
      const timeSinceChange = Date.now() - stateChangeTime.current;
      const popDuration = 400;
      const popEffect = timeSinceChange < popDuration ? Math.sin((timeSinceChange / popDuration) * Math.PI) * 0.3 + 1 : 1;


      ctx.beginPath();
      
      for (let i = 0; i <= lineCount; i++) {
        const x = i * segmentWidth;

        let amp1, freq1, phase1; // Main wave
        let amp2, freq2, phase2; // Secondary wave for complexity
        let amp3, freq3, phase3; // Noise/texture wave

        switch (state) {
          case AvatarState.Listening:
          case AvatarState.Speaking:
            amp1 = height * 0.3 * popEffect;
            freq1 = 4;
            phase1 = frameCount * 0.08;
            amp2 = height * 0.1 * popEffect;
            freq2 = 10;
            phase2 = frameCount * -0.1;
            amp3 = height * 0.05 * popEffect;
            freq3 = 20;
            phase3 = frameCount * 0.15;
            break;
          case AvatarState.Thinking:
             amp1 = height * 0.15 * popEffect;
             freq1 = 2;
             phase1 = frameCount * 0.02;
             amp2 = height * 0.15 * popEffect;
             freq2 = 12;
             phase2 = frameCount * 0.05;
             amp3 = height * 0.1 * popEffect;
             freq3 = 30;
             phase3 = frameCount * -0.08;
            break;
          case AvatarState.Idle:
          default:
            amp1 = height * 0.05 * popEffect;
            freq1 = 3;
            phase1 = frameCount * 0.02;
            amp2 = height * 0.03 * popEffect;
            freq2 = 8;
            phase2 = frameCount * 0.03;
            amp3 = height * 0.02 * popEffect;
            freq3 = 15;
            phase3 = frameCount * -0.02;
            break;
        }

        const y1 = Math.sin(i / freq1 + phase1) * amp1;
        const y2 = Math.sin(i / freq2 + phase2) * amp2;
        const y3 = Math.sin(i / freq3 + phase3) * amp3;
        
        const y = centerY + y1 + y2 + y3;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [state]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default WaveformAvatar;