
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraModuleProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CameraModule: React.FC<CameraModuleProps> = ({ onCapture, onCancel, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      alert("Acceso a cámara denegado.");
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [startCamera, stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      onCapture(canvas.toDataURL('image/jpeg').split(',')[1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="p-10 flex justify-between items-center bg-zinc-900 text-white">
        <button onClick={onCancel}>Cancelar</button>
        <button 
          onClick={capture} 
          disabled={isLoading}
          className="w-20 h-20 bg-white rounded-full border-8 border-white/20 active:scale-90 transition-all flex items-center justify-center"
        >
          {isLoading && <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>}
        </button>
        <div className="w-12"></div>
      </div>
    </div>
  );
};

export default CameraModule;
