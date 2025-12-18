import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Droplets, Sun, Trash2, Search, Camera, X, Loader2, Sparkles, ChevronLeft, Info, MapPin, Heart, ThermometerSun, Snowflake, Lightbulb, Bell, Clock, AlertTriangle, Scissors, FlaskRound, Layers } from 'lucide-react';
import { Plant, View, PlantCareInstructions, PlantLog } from './types';
import { identifyPlantByImage, searchPlantByName, generateLineArt, generateReferencePhoto } from './services/geminiService';
import CameraModule from './components/CameraModule';
import LightMeter from './components/LightMeter';

const PASTEL_PALETTE = [
  { bg: 'bg-[#FFF1F2]', border: 'border-[#FFF1F2]' }, // Rose
  { bg: 'bg-[#EFF6FF]', border: 'border-[#EFF6FF]' }, // Blue
  { bg: 'bg-[#ECFDF5]', border: 'border-[#ECFDF5]' }, // Emerald
  { bg: 'bg-[#FFFBEB]', border: 'border-[#FFFBEB]' }, // Amber
  { bg: 'bg-[#F5F3FF]', border: 'border-[#F5F3FF]' }, // Violet
  { bg: 'bg-[#F0FDF4]', border: 'border-[#F0FDF4]' }, // Green
  { bg: 'bg-[#FAF5FF]', border: 'border-[#FAF5FF]' }, // Purple
  { bg: 'bg-[#FFF7ED]', border: 'border-[#FFF7ED]' }, // Orange
  { bg: 'bg-[#F0FDFA]', border: 'border-[#F0FDFA]' }, // Teal
  { bg: 'bg-[#FDF2F8]', border: 'border-[#FDF2F8]' }, // Pink
];

const App: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('plant-tracker-v7');
    if (saved) setPlants(JSON.parse(saved));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Ubicación denegada.")
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('plant-tracker-v7', JSON.stringify(plants));
  }, [plants]);

  const currentSeason = useMemo(() => {
    const month = new Date().getMonth();
    const isNorthernHemisphere = userLocation ? userLocation.lat >= 0 : true;
    const isWarmMonths = month >= 3 && month <= 8;
    if (isNorthernHemisphere) return isWarmMonths ? 'summer' : 'winter';
    return isWarmMonths ? 'winter' : 'summer';
  }, [userLocation]);

  const addPlant = async (info: PlantCareInstructions) => {
    setLoading(true);
    try {
      setLoadingStep("Dibujando ilustración...");
      const imageUrl = await generateLineArt(info.commonName);
      
      setLoadingStep("Generando foto de referencia...");
      const referenceImageUrl = await generateReferencePhoto(info.commonName);
      
      const newPlant: Plant = {
        id: crypto.randomUUID(),
        name: info.commonName,
        species: info.scientificName,
        imageUrl,
        referenceImageUrl,
        instructions: info,
        logs: [],
        addedAt: new Date().toISOString()
      };
      setPlants(p => [newPlant, ...p]);
      setView('dashboard');
    } catch (e) {
      console.error(e);
      alert("Error creando la ficha.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const markAsWatered = (id: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id === id) {
        const newLog: PlantLog = {
          id: crypto.randomUUID(),
          type: 'watering',
          date: new Date().toISOString()
        };
        return { 
          ...p, 
          lastWateredAt: new Date().toISOString(),
          logs: [newLog, ...p.logs]
        };
      }
      return p;
    }));
    if (selectedPlant?.id === id) {
      setSelectedPlant(prev => prev ? ({ ...prev, lastWateredAt: new Date().toISOString() }) : null);
    }
  };

  const handleIdentify = async (base64: string) => {
    setLoading(true);
    try {
      setLoadingStep("Identificando...");
      const info = await identifyPlantByImage(base64);
      await addPlant(info);
    } catch (e) {
      alert("No se pudo identificar.");
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      setLoadingStep("Buscando...");
      const info = await searchPlantByName(searchQuery);
      await addPlant(info);
      setSearchQuery('');
    } catch (e) {
      alert("No encontrada.");
      setLoading(false);
    }
  };

  const getWateringStatus = (plant: Plant) => {
    const daysInterval = currentSeason === 'summer' 
      ? plant.instructions.wateringSummer 
      : plant.instructions.wateringWinter;
    const lastDate = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date(plant.addedAt);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + daysInterval);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysRemaining: diffDays,
      isUrgent: diffDays <= 0,
      nextDate: nextDate.toLocaleDateString()
    };
  };

  const BarMeter = ({ level, iconColor, barColor, icon: Icon }: { level: number, iconColor: string, barColor: string, icon: any }) => (
    <div className="flex gap-2 items-center">
      <Icon size={14} className={iconColor} />
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-3 w-1.5 rounded-full ${i <= level ? barColor : 'bg-slate-200'}`} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] bg-plant-pattern text-slate-800 font-sans selection:bg-emerald-100">
      
      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div className="max-w-2xl mx-auto p-6 space-y-6 pb-32 animate-in fade-in duration-500">
          <header className="flex justify-between items-start pt-4">
            <div>
              <h1 className="text-2xl font-black text-emerald-900 italic">JardinerIA</h1>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <MapPin size={10} />
                {currentSeason === 'summer' ? 'Verano Detectado' : 'Invierno Detectado'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('light-meter')} className="w-12 h-12 bg-white border border-slate-200 text-amber-500 rounded-2xl shadow-sm flex items-center justify-center active:scale-90 transition-transform">
                <Lightbulb size={24} />
              </button>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                {plants.length} Plantas
              </div>
            </div>
          </header>

          {plants.length === 0 ? (
            <div className="py-24 text-center space-y-4 opacity-30">
              <Sparkles size={40} className="mx-auto" />
              <p className="text-sm font-medium">Empieza escaneando tu primera planta.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {plants.map((plant, idx) => {
                const colors = PASTEL_PALETTE[idx % PASTEL_PALETTE.length];
                const status = getWateringStatus(plant);
                return (
                  <div key={plant.id} onClick={() => { setSelectedPlant(plant); setView('plant-detail'); }} className={`border-4 rounded-[2.5rem] p-4 flex gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden h-36 bg-white ${colors.border}`}>
                    <div className={`w-24 h-full rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${colors.bg}`}>
                      <img src={plant.imageUrl} className="max-w-[85%] max-h-[85%] object-contain mix-blend-multiply" alt={plant.name} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 relative z-10">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold capitalize leading-tight text-slate-800">{plant.name}</h3>
                          {status.isUrgent && <Bell size={16} className="text-red-500 fill-red-500 animate-bounce" />}
                        </div>
                        <p className="text-[10px] text-slate-400 italic truncate">{plant.species}</p>
                      </div>
                      <div className="space-y-2">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight ${status.isUrgent ? 'text-red-500' : 'text-slate-400'}`}>
                          <Droplets size={12} />
                          {status.isUrgent ? '¡Toca regar ya!' : `Riego en ${status.daysRemaining} días`}
                        </div>
                        <div className="flex gap-4">
                          <BarMeter level={plant.instructions.lightLevel} iconColor="text-amber-500" barColor="bg-amber-400" icon={Sun} />
                          <BarMeter level={plant.instructions.waterLevel} iconColor="text-blue-500" barColor="bg-blue-400" icon={Droplets} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
            <button onClick={() => setView('add-choice')} className="w-16 h-16 bg-emerald-700 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
              <Plus size={32} />
            </button>
          </div>
        </div>
      )}

      {/* Plant Detail View */}
      {view === 'plant-detail' && selectedPlant && (
        <div className="min-h-screen bg-white animate-in slide-in-from-right duration-300 pb-20 bg-plant-pattern">
          <div className="p-8 space-y-6">
            <header className="flex justify-between items-start mb-4">
              <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-600 border border-slate-100">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => { if(confirm("¿Eliminar ficha?")) { setPlants(p => p.filter(pl => pl.id !== selectedPlant.id)); setView('dashboard'); } }} className="p-2 bg-white rounded-xl shadow-sm text-red-400 border border-slate-100">
                <Trash2 size={20} />
              </button>
            </header>

            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h2 className="text-3xl font-black capitalize">{selectedPlant.name}</h2>
                <p className="text-emerald-700 font-medium italic">{selectedPlant.species}</p>
              </div>
            </div>

            {/* 1. PRÓXIMO RIEGO */}
            <section className="bg-blue-900 text-white rounded-[2rem] p-6 shadow-xl shadow-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Próximo Riego</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {currentSeason === 'summer' ? 'Verano' : 'Invierno'}
                  </div>
                  <button 
                    onClick={() => markAsWatered(selectedPlant.id)} 
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all border border-white/10"
                  >
                    <Droplets size={24} />
                  </button>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{getWateringStatus(selectedPlant).daysRemaining > 0 ? getWateringStatus(selectedPlant).daysRemaining : '¡Hoy!'}</span>
                <span className="text-lg font-bold text-blue-200">{getWateringStatus(selectedPlant).daysRemaining > 0 ? (selectedPlant.logs.length > 0 ? 'días' : 'días restantes') : ''}</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                 <div className="flex-1 h-2 bg-blue-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-400" style={{ width: `${Math.max(0, Math.min(100, (1 - getWateringStatus(selectedPlant).daysRemaining / (currentSeason === 'summer' ? selectedPlant.instructions.wateringSummer : selectedPlant.instructions.wateringWinter)) * 100))}%` }} />
                 </div>
                 <span className="text-[10px] font-bold text-blue-300">{getWateringStatus(selectedPlant).nextDate}</span>
              </div>
            </section>

            {/* 2. ORIGEN */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <MapPin size={16} color="#446F4A" /> Origen
              </div>
              <p className="text-[#969191] text-sm leading-relaxed">{selectedPlant.instructions.origin}</p>
            </section>

            {/* 3. ACERCA DE ESTA PLANTA */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <Info size={16} color="#446F4A" /> Acerca de esta planta
              </div>
              <p className="text-[#969191] text-sm leading-relaxed">{selectedPlant.instructions.description}</p>
            </section>

            {/* 4. PROBLEMAS FRECUENTES */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-red-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <AlertTriangle size={16} color="#446F4A" /> Problemas frecuentes
              </div>
              <p className="text-[#969191] text-sm leading-relaxed italic">{selectedPlant.instructions.frequentProblems}</p>
            </section>

            {/* 5. ABONO Y/O FERTILIZACIÓN */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <FlaskRound size={16} color="#446F4A" /> Abono y/o fertilización
              </div>
              <p className="text-[#969191] text-sm leading-relaxed">{selectedPlant.instructions.fertilization}</p>
            </section>

            {/* NUEVA SECCIÓN: SUSTRATO */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <Layers size={16} color="#446F4A" /> Sustrato
              </div>
              <p className="text-[#969191] text-sm leading-relaxed">
                {selectedPlant.instructions.substrate || "Se recomienda un sustrato con buen drenaje y materia orgánica adaptado a su especie."}
              </p>
            </section>

            {/* 6. PODA */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#446F4A] font-bold text-sm uppercase tracking-wider mb-2">
                <Scissors size={16} color="#446F4A" /> Poda
              </div>
              <p className="text-[#969191] text-sm leading-relaxed">{selectedPlant.instructions.pruning}</p>
            </section>

            {/* 7. FRECUENCIA DE RIEGO */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#324DA0] font-bold text-sm uppercase tracking-wider mb-2">
                <Droplets size={16} color="#324DA0" /> Frecuencia de Riego
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-orange-500 text-[13px] font-black uppercase">
                    <ThermometerSun size={12} /> Verano
                  </div>
                  <p className="text-[12px] font-bold text-slate-800">{selectedPlant.instructions.wateringSummer} días</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[13px] font-black uppercase">
                    <Snowflake size={12} /> Invierno
                  </div>
                  <p className="text-[12px] font-bold text-slate-800">{selectedPlant.instructions.wateringWinter} días</p>
                </div>
              </div>
            </section>

            {/* 8. REQUERIMIENTO LUMÍNICO */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 text-[#F9AA32] font-bold text-sm uppercase tracking-wider mb-2">
                Requerimiento Lumínico
              </div>
              <div className="flex flex-col items-center justify-center py-2">
                <p className="text-lg font-bold text-slate-800">{selectedPlant.instructions.targetLumens} Lux</p>
              </div>
            </section>

            {/* RECOMENDACIONES DEL MAESTRO */}
            <div className="bg-emerald-900 text-white p-7 rounded-[2.5rem] space-y-4 shadow-xl shadow-emerald-100/50 relative overflow-hidden mt-4">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <Heart size={80} />
              </div>
              <div className="flex items-center gap-2 font-bold text-emerald-200 text-xs uppercase tracking-widest relative z-10">
                <Heart size={14} /> Recomendaciones del maestro
              </div>
              <p className="text-sm leading-relaxed opacity-95 relative z-10 font-medium">{selectedPlant.instructions.recommendations}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vistas de Añadir y Carga */}
      {view === 'add-choice' && (
        <div className="fixed inset-0 bg-white z-50 p-8 flex flex-col justify-center animate-in fade-in zoom-in duration-200 bg-plant-pattern">
          <button onClick={() => setView('dashboard')} className="absolute top-10 right-10 p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={28} /></button>
          <div className="max-w-xs mx-auto w-full space-y-4 text-center">
            <h2 className="text-2xl font-black mb-10 text-emerald-950">Añadir Planta</h2>
            <button onClick={() => setView('camera')} className="w-full bg-emerald-700 text-white py-6 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
              <Camera size={24} /> Escanear Foto
            </button>
            <button onClick={() => setView('search')} className="w-full bg-slate-100 text-slate-700 py-6 rounded-[2rem] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Search size={24} /> Buscar por nombre
            </button>
          </div>
        </div>
      )}

      {view === 'search' && (
        <div className="max-w-md mx-auto p-8 pt-20 space-y-8 animate-in slide-in-from-bottom duration-300">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"><ChevronLeft size={18}/> Cancelar</button>
          <h2 className="text-3xl font-black text-slate-800">Identificar</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <input autoFocus type="text" placeholder="Ej: Poto, Aloe Vera..." className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-500 outline-none transition-all text-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button disabled={loading} className="w-full bg-emerald-700 text-white p-6 rounded-[2rem] font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-200">
              {loading ? <Loader2 className="animate-spin" /> : "Generar Ficha"}
            </button>
          </form>
        </div>
      )}

      {view === 'camera' && <CameraModule onCapture={handleIdentify} onCancel={() => setView('dashboard')} isLoading={loading} />}
      {view === 'light-meter' && <LightMeter onClose={() => setView('dashboard')} />}

      {loading && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-10 text-center space-y-8 bg-plant-pattern">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-50 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            <Sprout size={32} className="absolute inset-0 m-auto text-emerald-800 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-emerald-950">Analizando botánica...</h3>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{loadingStep}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Sprout = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7 20 3-3 3 3" />
    <path d="M10 17V5" />
    <path d="M10 9a7 7 0 0 1 7 7" />
    <path d="M10 13a4 4 0 0 0-4 4" />
  </svg>
);

export default App;