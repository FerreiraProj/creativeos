import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProjectModal } from './components/ProjectModal';
import { AiGatewayModal } from './components/AiGatewayModal';
import { BrandMemoryView } from './components/BrandMemoryView';
import { CreativePipelineKanban } from './components/CreativePipelineKanban';
import { CreativeStudio } from './components/CreativeStudio';
import { ShotStudio } from './components/ShotStudio';
import { CharacterVault } from './components/CharacterVault';
import { RecipesView } from './components/RecipesView';
import { CreativeLibrary } from './components/CreativeLibrary';
import { PerformanceIntelligenceView } from './components/PerformanceIntelligenceView';
import { CreativeDetailModal } from './components/CreativeDetailModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { LoginScreen } from './components/LoginScreen';

import {
  Project,
  Creative,
  BrandMemory,
  Character,
  Recipe,
  CreativePipelineStatus,
  AiGatewayConfig,
  CreativeMemoryItem,
} from './types';
import {
  getStoredProjects,
  saveActiveProject,
  deleteStoredProject,
  getActiveProjectId,
  setActiveProjectId as storeActiveProjectId,
  getStoredAiGatewayConfig,
  saveStoredAiGatewayConfig,
  createNewProject,
  duplicateProjectStructure,
  loadSampleNootrionProject,
} from './lib/storage';
import {
  FolderPlus,
  Sparkles,
  Layers,
  Clapperboard,
  BookOpen,
  Users,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_AI_GATEWAY_CONFIG: AiGatewayConfig = {
  textModel: 'gemini-3.6-flash',
  videoModel: 'gemini-omni',
  audioModel: 'gemini-tts',
  byokKeys: { geminiApiKey: '', falApiKey: '', openaiApiKey: '' },
};

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [aiGatewayConfig, setAiGatewayConfig] = useState<AiGatewayConfig>(DEFAULT_AI_GATEWAY_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthenticated' | 'authenticated'>('checking');

  // Modal open states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAiGatewayModalOpen, setIsAiGatewayModalOpen] = useState(false);
  const [isCreativeDetailModalOpen, setIsCreativeDetailModalOpen] = useState(false);
  const [isVideoPlayerModalOpen, setIsVideoPlayerModalOpen] = useState(false);

  // Check session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setAuthStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
      } catch {
        setAuthStatus('unauthenticated');
      }
    })();
  }, []);

  // Initialize from the server-backed API (Postgres), once logged in
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    setIsLoading(true);
    (async () => {
      try {
        const [loadedProjects, storedActiveId, storedAiGatewayConfig] = await Promise.all([
          getStoredProjects(),
          getActiveProjectId(),
          getStoredAiGatewayConfig(),
        ]);
        setProjects(loadedProjects);
        setAiGatewayConfig(storedAiGatewayConfig);

        if (storedActiveId && loadedProjects.some((p) => p.id === storedActiveId)) {
          setActiveProjectId(storedActiveId);
        } else if (loadedProjects.length > 0) {
          setActiveProjectId(loadedProjects[0].id);
          storeActiveProjectId(loadedProjects[0].id).catch(console.error);
        }
      } catch (err: any) {
        console.error('Failed to load initial app state:', err);
        setSaveError(err.message || 'Failed to load data from the server.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authStatus]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Handler: Select Project
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    storeActiveProjectId(id).catch(console.error);
    setSelectedCreative(null);
  };

  // Handler: Create Project
  const handleCreateProject = async (name: string, description: string, codePrefix: string) => {
    try {
      const newProj = await createNewProject(name, description, codePrefix);
      setProjects((prev) => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      await storeActiveProjectId(newProj.id);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setSaveError(err.message || 'Failed to create project.');
    }
  };

  // Handler: Duplicate Project
  const handleDuplicateProject = async (sourceId: string, newName: string, newPrefix: string) => {
    try {
      const duplicated = await duplicateProjectStructure(sourceId, newName, newPrefix);
      setProjects((prev) => [...prev, duplicated]);
      setActiveProjectId(duplicated.id);
      await storeActiveProjectId(duplicated.id);
    } catch (err: any) {
      console.error('Failed to duplicate project:', err);
      setSaveError(err.message || 'Failed to duplicate project.');
    }
  };

  // Handler: Delete Project
  const handleDeleteProject = async (id: string) => {
    try {
      const remaining = await deleteStoredProject(id);
      setProjects(remaining);
      if (activeProjectId === id) {
        const nextId = remaining[0]?.id || null;
        setActiveProjectId(nextId);
        await storeActiveProjectId(nextId);
      }
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setSaveError(err.message || 'Failed to delete project.');
    }
  };

  // Handler: Load Nootrion Sample
  const handleLoadNootrion = async () => {
    try {
      const nootrionProj = await loadSampleNootrionProject();
      setProjects((prev) => [nootrionProj, ...prev.filter((p) => p.id !== nootrionProj.id)]);
      setActiveProjectId(nootrionProj.id);
      await storeActiveProjectId(nootrionProj.id);
      setIsProjectModalOpen(false);
    } catch (err: any) {
      console.error('Failed to load Nootrion demo:', err);
      setSaveError(err.message || 'Failed to load Nootrion demo.');
    }
  };

  // Handler: Update Active Project (optimistic: update UI immediately, persist in the
  // background, surface an error if the save fails so a keystroke never blocks on the network)
  const updateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveActiveProject(updated).catch((err: any) => {
      console.error('Failed to save project:', err);
      setSaveError(err.message || 'Failed to save changes.');
    });
  };

  // Sub-handlers for project data slices
  const handleUpdateBrandMemory = (memory: BrandMemory) => {
    if (!activeProject) return;
    updateProject({ ...activeProject, brandMemory: memory });
  };

  const handleUpdateCharacters = (characters: Character[]) => {
    if (!activeProject) return;
    updateProject({ ...activeProject, characters });
  };

  const handleUpdateCustomRecipes = (customRecipes: Recipe[]) => {
    if (!activeProject) return;
    updateProject({ ...activeProject, customRecipes });
  };

  const handleUpdateCreative = (updatedCreative: Creative) => {
    if (!activeProject) return;
    const existing = activeProject.creatives || [];
    const index = existing.findIndex((c) => c.id === updatedCreative.id);
    let newCreatives: Creative[];
    if (index >= 0) {
      newCreatives = [...existing];
      newCreatives[index] = updatedCreative;
    } else {
      newCreatives = [updatedCreative, ...existing];
    }
    updateProject({ ...activeProject, creatives: newCreatives });
    if (selectedCreative?.id === updatedCreative.id) {
      setSelectedCreative(updatedCreative);
    }
  };

  const handleUpdateCreativeStatus = (creativeId: string, newStatus: CreativePipelineStatus) => {
    if (!activeProject) return;
    const existing = activeProject.creatives || [];
    const updated = existing.map((c) =>
      c.id === creativeId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
    );
    updateProject({ ...activeProject, creatives: updated });
  };

  const handleAddCreativeMemory = (item: CreativeMemoryItem) => {
    if (!activeProject) return;
    const existing = activeProject.creativeMemory || [];
    updateProject({
      ...activeProject,
      creativeMemory: [item, ...existing],
    });
  };

  const handleSaveCreativeAndOpenShots = (newCreative: Creative) => {
    handleUpdateCreative(newCreative);
    setSelectedCreative(newCreative);
    setActiveTab('shots');
  };

  const handleSaveAiGatewayConfig = (newConfig: AiGatewayConfig) => {
    setAiGatewayConfig(newConfig);
    saveStoredAiGatewayConfig(newConfig).catch((err: any) => {
      console.error('Failed to save AI Gateway settings:', err);
      setSaveError(err.message || 'Failed to save AI Gateway settings.');
    });
  };

  if (authStatus === 'checking' || (authStatus === 'authenticated' && isLoading)) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex items-center justify-center font-sans">
        <span className="text-xs uppercase tracking-widest text-white/40">Loading workspace…</span>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <LoginScreen onLoginSuccess={() => setAuthStatus('authenticated')} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans antialiased selection:bg-[#F27D26] selection:text-black">
      {saveError && (
        <div className="bg-red-950/80 border-b border-red-500/40 text-red-200 text-xs px-4 py-2 flex items-center justify-between gap-3">
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-200/70 hover:text-white cursor-pointer font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Strict 3-Zone Single Row Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProject={activeProject}
        projects={projects}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenAiGatewayModal={() => setIsAiGatewayModalOpen(true)}
        onQuickNewCreative={() => {
          setActiveTab('studio');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {!activeProject ? (
          /* Empty State: No project created yet */
          <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#F27D26] flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#F27D26] font-bold block">
                Workspace Initialization
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight">
                Creative Operating System
              </h1>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                AI creative engine for planning, generating, managing, and scaling high-performing content with strict project isolation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-black/60 border border-white/10 text-xs text-white/70 text-left space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <BrainCircuit className="w-4 h-4 text-[#F27D26]" />
                <span className="text-xs tracking-wide">Isolated Brand & Creative Memory</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/50">
                Create brands (Nootrion, Restaurants, Fashion, B2B SaaS) without cross-contamination. Each brand has its own tone, audience pains, characters, and winning hooks memory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Create New Project</span>
              </button>

              <button
                onClick={handleLoadNootrion}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#F27D26]" />
                <span>Load Nootrion Demo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Project Tab Content */
          <div>
            {activeTab === 'pipeline' && (
              <CreativePipelineKanban
                project={activeProject}
                onSelectCreative={(cr) => {
                  setSelectedCreative(cr);
                  setIsCreativeDetailModalOpen(true);
                }}
                onOpenShotStudio={(cr) => {
                  setSelectedCreative(cr);
                  setActiveTab('shots');
                }}
                onNewCreative={() => setActiveTab('studio')}
                onUpdateCreativeStatus={handleUpdateCreativeStatus}
              />
            )}

            {activeTab === 'studio' && (
              <CreativeStudio
                project={activeProject}
                aiGatewayConfig={aiGatewayConfig}
                onSaveCreativeAndOpenShots={handleSaveCreativeAndOpenShots}
                onUpdateCreativeMemory={handleAddCreativeMemory}
              />
            )}

            {activeTab === 'shots' && (
              <ShotStudio
                project={activeProject}
                aiGatewayConfig={aiGatewayConfig}
                selectedCreative={selectedCreative}
                onSelectCreative={(cr) => setSelectedCreative(cr)}
                onUpdateCreative={handleUpdateCreative}
                onOpenVideoPlayerModal={(cr) => {
                  setSelectedCreative(cr);
                  setIsVideoPlayerModalOpen(true);
                }}
              />
            )}

            {activeTab === 'brand-memory' && (
              <BrandMemoryView
                project={activeProject}
                onUpdateBrandMemory={handleUpdateBrandMemory}
              />
            )}

            {activeTab === 'characters' && (
              <CharacterVault
                project={activeProject}
                aiGatewayConfig={aiGatewayConfig}
                onUpdateCharacters={handleUpdateCharacters}
              />
            )}

            {activeTab === 'recipes' && (
              <RecipesView
                project={activeProject}
                onUpdateCustomRecipes={handleUpdateCustomRecipes}
                onSelectRecipeForStudio={(recipe) => {
                  setActiveTab('studio');
                }}
              />
            )}

            {activeTab === 'library' && (
              <CreativeLibrary
                project={activeProject}
                onSelectCreative={(cr) => {
                  setSelectedCreative(cr);
                  setIsCreativeDetailModalOpen(true);
                }}
                onOpenShotStudio={(cr) => {
                  setSelectedCreative(cr);
                  setActiveTab('shots');
                }}
              />
            )}

            {activeTab === 'intelligence' && (
              <PerformanceIntelligenceView
                project={activeProject}
                aiGatewayConfig={aiGatewayConfig}
                onSelectCreative={(cr) => {
                  setSelectedCreative(cr);
                  setIsCreativeDetailModalOpen(true);
                }}
                onUpdateCreativeMemory={handleAddCreativeMemory}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onLoadNootrionSample={handleLoadNootrion}
      />

      <AiGatewayModal
        isOpen={isAiGatewayModalOpen}
        onClose={() => setIsAiGatewayModalOpen(false)}
        config={aiGatewayConfig}
        onSaveConfig={handleSaveAiGatewayConfig}
      />

      <CreativeDetailModal
        isOpen={isCreativeDetailModalOpen}
        onClose={() => setIsCreativeDetailModalOpen(false)}
        creative={selectedCreative}
        project={activeProject || ({} as Project)}
        onOpenShotStudio={(cr) => {
          setSelectedCreative(cr);
          setActiveTab('shots');
        }}
        onUpdateCreative={handleUpdateCreative}
      />

      <VideoPlayerModal
        isOpen={isVideoPlayerModalOpen}
        onClose={() => setIsVideoPlayerModalOpen(false)}
        creative={selectedCreative}
        project={activeProject || ({} as Project)}
      />
    </div>
  );
}

export default App;
