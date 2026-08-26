import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Share2,
  Sparkles,
  Clapperboard,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Creative, Project } from '../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  creative: Creative | null;
  project: Project;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  creative,
  project,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeShotIdx, setActiveShotIdx] = useState(0);

  if (!isOpen || !creative) return null;

  const shots = creative.shots || [];
  const character = project.characters?.find((c) => c.id === creative.characterId);
  const totalDuration = shots.reduce((acc, s) => acc + (s.durationSec || 5), 0) || 25;

  const currentShot = shots[activeShotIdx] || shots[0];

  // Playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 0.1;

          // Determine shot
          let elapsed = 0;
          for (let i = 0; i < shots.length; i++) {
            elapsed += shots[i].durationSec || 5;
            if (next <= elapsed) {
              setActiveShotIdx(i);
              break;
            }
          }

          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, shots]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left: Video Player Canvas (9:16 vertical video simulator) */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-6 min-h-[420px] md:min-h-[600px]">
          <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#0F0F0F]">
            {/* Shot background visual */}
            <img
              src={
                currentShot?.imageUrl ||
                character?.referenceImageUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
              }
              alt="Video Shot"
              className={`w-full h-full object-cover transition-transform duration-1000 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/60" />

            {/* Top Bar inside Video */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10">
                SHOT {activeShotIdx + 1} / {shots.length}
              </span>
              <span className="text-[9px] font-mono uppercase bg-[#F27D26] text-black font-bold px-2 py-0.5 rounded">
                {currentShot?.type || 'Talking Head'}
              </span>
            </div>

            {/* Subtitles & Spoken Dialogue Karaoke */}
            <div className="absolute inset-x-4 bottom-16 text-center">
              <div className="bg-black/85 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15 shadow-2xl">
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug tracking-wide">
                  "{currentShot?.spokenText}"
                </p>
                {currentShot?.onScreenText && (
                  <span className="text-[10px] font-mono text-[#F27D26] font-bold block mt-1.5 uppercase tracking-wider">
                    {currentShot.onScreenText}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar inside phone view */}
            <div className="absolute bottom-2 inset-x-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F27D26] transition-all duration-100"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Sequence Controls & Shot Inspector */}
        <div className="w-full md:w-80 p-6 bg-[#0F0F0F] border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-[#F27D26]">
                  {creative.code}
                </span>
                <h3 className="text-sm font-serif italic text-white truncate">{creative.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-white/40">
                <span>Time: {currentTime.toFixed(1)}s</span>
                <span>Total: {totalDuration.toFixed(1)}s</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const prev = Math.max(0, activeShotIdx - 1);
                    setActiveShotIdx(prev);
                  }}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3.5 rounded-full bg-white hover:bg-neutral-200 text-black font-bold transition shadow-md cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => {
                    const next = Math.min(shots.length - 1, activeShotIdx + 1);
                    setActiveShotIdx(next);
                  }}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Shots Sequence Thumbnails List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                Active Shot Timeline ({shots.length})
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {shots.map((s, idx) => {
                  const isCurrent = activeShotIdx === idx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveShotIdx(idx);
                        setIsPlaying(false);
                      }}
                      className={`w-full p-2.5 rounded-lg text-left transition flex items-center justify-between text-xs cursor-pointer ${
                        isCurrent
                          ? 'bg-[#141414] border border-[#F27D26] text-white font-medium shadow-sm'
                          : 'bg-black/40 border border-white/5 text-white/50 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className="truncate">
                        #{s.shotNumber} {s.type}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">~{s.durationSec}s</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <button
              disabled
              title="Real video rendering (Fal.ai / Gemini Omni) is not implemented yet — this preview is a script/timing simulation only."
              className="w-full py-2.5 bg-white/10 text-white/40 font-bold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rendered MP4 & Captions (Coming Soon)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
