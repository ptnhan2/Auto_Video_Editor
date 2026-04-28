import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { WaddleSprite } from '../components/WaddleSprite';

export const WaddleEngineTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a', padding: 50 }}>
      <h1 style={{ color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
        Waddle Engine Performance Test
      </h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '80%' }}>
        
        {/* CASE 1: Standard Waddle (Idle/Slow Walk) */}
        <div style={{ textAlign: 'center', width: 300 }}>
          <div style={{ height: 400, width: 300, border: '1px solid #333', position: 'relative' }}>
            <WaddleSprite 
              src="assets/humanoid/char_001/parts/body.png" 
              waddleSpeed={0.1} 
              waddleAmplitude={8} 
            />
          </div>
          <p style={{ color: '#888', marginTop: 10 }}>Standard (Speed: 0.1, Amp: 8)</p>
        </div>

        {/* CASE 2: Fast Waddle (Running/Excited) */}
        <div style={{ textAlign: 'center', width: 300 }}>
          <div style={{ height: 400, width: 300, border: '1px solid #333', position: 'relative' }}>
            <WaddleSprite 
              src="assets/humanoid/char_001/parts/body.png" 
              waddleSpeed={0.3} 
              waddleAmplitude={20} 
            />
          </div>
          <p style={{ color: '#888', marginTop: 10 }}>Fast (Speed: 0.3, Amp: 20)</p>
        </div>

        {/* CASE 3: Chroma Key Test (Green Screen removal) */}
        <div style={{ textAlign: 'center', width: 300 }}>
          <div style={{ height: 400, width: 300, border: '1px solid #333', position: 'relative', background: 'url(https://www.transparenttextures.com/patterns/checkerboard.png)' }}>
            {/* Giả định có một asset nền xanh để test */}
            <WaddleSprite 
              src="assets/humanoid/char_001/parts/body.png" 
              enableGreenScreen={true}
              waddleSpeed={0.15}
            />
          </div>
          <p style={{ color: '#888', marginTop: 10 }}>Chroma Key (Green Background Removal)</p>
        </div>

      </div>

      <div style={{ color: 'white', marginTop: 50, fontSize: 14, opacity: 0.6, fontFamily: 'monospace' }}>
        - Algorithm: Rotation = sin(f * speed) * amp <br/>
        - Gravity: Bounce = -abs(cos(f * speed)) * (amp * 1.5) <br/>
        - Pivot: Bottom Center (100% Fixed)
      </div>
    </AbsoluteFill>
  );
};
