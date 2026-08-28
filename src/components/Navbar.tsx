import React from 'react';
import {
  Sparkles,
  FolderKanban,
  Clapperboard,
  BookOpen,
  Users,
  Film,
  BrainCircuit,
  Sliders,
  Plus,
  ChevronDown,
  Layers,
  Zap,
  Newspaper,
} from 'lucide-react';
import { Project } from '../types';

export type ActiveTab =
  | 'pipeline'
  | 'studio'
  | 'shots'
  | 'brand-memory'
  | 'characters'
  | 'recipes'
  | 'library'
  | 'intelligence'
  | 'blog';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeProject: Project | null;
  projects: Project[];
  onOpenProjectModal: () => void;
  onOpenAiGatewayModal: () => void;
  onQuickNewCreative: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProject,
  projects,
  onOpenProjectModal,
  onOpenAiGatewayModal,
  onQuickNewCreative,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'studio', label: 'AI Studio', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'shots', label: 'Shot Engine', icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'brand-memory', label: 'Brand Memory', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
    { id: 'recipes', label: 'Recipes', icon: <Layers className="w-4 h-4" /> },
    { id: 'blog', label: 'Blog', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <Film className="w-4 h-4" /> },
    { id: 'intelligence', label: 'Intelligence', icon: <BrainCircuit className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-white/10 text-[#e0e0e0]">
      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Project Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F27D26] flex items-center justify-center text-black font-bold text-sm tracking-wider shadow-sm">
              OS
            </div>
            <div className="hidden sm:block">
              <span className="font-bold tracking-[0.2em] text-white text-xs uppercase block opacity-90">
                Creative OS
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Project Switcher Trigger */}
          <button
            onClick={onOpenProjectModal}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition text-xs font-medium text-zinc-200 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#F27D26] shrink-0" />
            <span className="max-w-[130px] truncate font-semibold text-white">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            {activeProject && (
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                #{activeProject.codePrefix}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
          </button>
        </div>

        {/* Zone 2: Navigation Links (Max 6 visible on desktop, overflow hidden gracefully) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold border border-white/15 shadow-sm'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAiGatewayModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition text-xs cursor-pointer font-medium"
            title="AI Gateway & BYOK Keys"
          >
            <Zap className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="hidden sm:inline">AI Gateway</span>
          </button>

          <button
            onClick={onQuickNewCreative}
            disabled={!activeProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="whitespace-nowrap">New Creative</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row for small screens */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-white/5 overflow-x-auto bg-[#080808]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
