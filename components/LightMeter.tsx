
import React, { useRef, useEffect, useState } from 'react';

const LightMeter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lux, setLux] = useState(0);
  const [category, setCategory] = useState('Midiendo...');

  useEffect(() => {
    let stream: MediaStream;
    let frameId: number;

    const startMeter = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const analyze = () => {
          if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 64, 64);
              const imageData = ctx.getImageData(0, 0, 64, 64);
              const data = imageData.data;
              let brightness = 0;
              for (let i = 0; i < data.length; i += 4) {
                brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
              }
              const avg = brightness / (data.length / 4);
              const estimatedLux = Math.round(avg * 40);
              setLux(estimatedLux);
              
              if (estimatedLux < 500) setCategory('Poca Luz');
              else if (estimatedLux < 2500) setCategory('Sombra Parcial');
              else if (estimatedLux < 5000) setCategory('Luz Indirecta Brillante');
              else setCategory('Luz Solar Directa');
            }
          }
          frameId = requestAnimationFrame(analyze);
        };
        analyze();
      } catch (e) {
        alert("Se requiere la cámara para el medidor de luz.");
        onClose();
      }
    };

    startMeter();
    return () => {
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-6 text-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Fotómetro Inteligente</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">✕</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="relative w-48 h-48 rounded-full border-8 border-green-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-black text-green-400">{lux}</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Lux Est.</div>
          </div>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="46" 
              fill="none" stroke="currentColor" strokeWidth="8" 
              className="text-green-500" 
              strokeDasharray="289" 
              strokeDashoffset={289 - (Math.min(lux, 10000) / 10000) * 289}
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold mb-1">{category}</p>
          <p className="text-sm text-slate-400 max-w-xs">
            Apunta la cámara hacia el lugar donde quieres colocar tu planta.
          </p>
        </div>

        <video ref={videoRef} autoPlay playsInline className="w-32 h-32 rounded-xl object-cover border-2 border-white/20" />
        <canvas ref={canvasRef} width="64" height="64" className="hidden" />
      </div>

      <div className="bg-white/5 rounded-2xl p-4 text-sm text-slate-300">
        <p className="font-bold mb-2">💡 Consejos de Crecimiento:</p>
        <ul className="space-y-1">
          <li>• Poca Luz: Helechos, Potus, Sansevierias</li>
          <li>• Luz Indirecta: Monsteras, Ficus Lyrata</li>
          <li>• Sol Directo: Suculentas, Cactus, Hierbas</li>
        </ul>
      </div>
    </div>
  );
};

export default LightMeter;
