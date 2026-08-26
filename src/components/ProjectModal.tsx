import React, { useState } from 'react';
import {
  FolderPlus,
  Copy,
  Trash2,
  Check,
  X,
  Sparkles,
  Building2,
  Utensils,
  Shirt,
  Laptop,
  User,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string, codePrefix: string) => void;
  onDuplicateProject: (sourceId: string, newName: string, newPrefix: string) => void;
  onDeleteProject: (id: string) => void;
  onLoadNootrionSample: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onLoadNootrionSample,
}) => {
  const [view, setView] = useState<'list' | 'create' | 'duplicate'>('list');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  const [duplicateSourceId, setDuplicateSourceId] = useState<string>('');

  if (!isOpen) return null;

  const quickTemplates = [
    {
      name: 'Nootrion',
      prefix: 'NOO',
      desc: 'Suplementos nootrópicos avançados para foco e performance cerebral.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    },
    {
      name: 'Restaurante Gourmet X',
      prefix: 'RES',
      desc: 'Experiência gastronómica premium e storytelling de pratos de autor.',
      icon: <Utensils className="w-4 h-4 text-amber-400" />,
    },
    {
      name: 'Marca de Roupa Y',
      prefix: 'MRY',
      desc: 'Moda streetwear sustentável com estética minimalista urbana.',
      icon: <Shirt className="w-4 h-4 text-purple-400" />,
    },
    {
      name: 'SaaS B2B Z',
      prefix: 'SAS',
      desc: 'Plataforma de automação de vendas e inteligência operacional.',
      icon: <Laptop className="w-4 h-4 text-blue-400" />,
    },
    {
      name: 'Projeto Pessoal / Creator',
      prefix: 'PSL',
      desc: 'Marca pessoal de autoridade em negócios e tecnologia.',
      icon: <User className="w-4 h-4 text-rose-400" />,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const prefix = codePrefix.trim() || name.slice(0, 3).toUpperCase();
    onCreateProject(name.trim(), description.trim(), prefix);
    setName('');
    setDescription('');
    setCodePrefix('');
    setView('list');
    onClose();
  };

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateSourceId || !name.trim()) return;
    const prefix = codePrefix.trim() || name.slice(0, 3).toUpperCase();
    onDuplicateProject(duplicateSourceId, name.trim(), prefix);
    setName('');
    setDescription('');
    setCodePrefix('');
    setView('list');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif italic text-white">
              {view === 'list' && 'Project Workspaces'}
              {view === 'create' && 'Create New Project'}
              {view === 'duplicate' && 'Duplicate Project Structure'}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {view === 'list' && 'Each project maintains strictly isolated brand & creative memory.'}
              {view === 'create' && 'Initialize a new brand universe with empty memory.'}
              {view === 'duplicate' && 'Clone structure and recipes without copying brand-specific memory.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {view === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white">
                  Active Projects ({projects.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onLoadNootrionSample}
                    className="text-xs font-bold uppercase tracking-wider text-[#F27D26] hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
                  >
                    Load Nootrion Demo
                  </button>
                  <button
                    onClick={() => {
                      setView('create');
                      setName('');
                      setDescription('');
                      setCodePrefix('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#F27D26]" />
                    <span>+ New Project</span>
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-[#0F0F0F]">
                  <Building2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-base font-serif italic text-white">No projects yet</p>
                  <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                    Create your first brand project or load the Nootrion demo to explore the Creative OS.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => setView('create')}
                      className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition cursor-pointer"
                    >
                      Create Project
                    </button>
                    <button
                      onClick={onLoadNootrionSample}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Load Nootrion Demo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const isActive = proj.id === activeProjectId;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                        className={`group p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isActive
                            ? 'bg-[#141414] border-[#F27D26] shadow-sm'
                            : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                              isActive
                                ? 'bg-[#F27D26] text-black'
                                : 'bg-white/10 text-white group-hover:bg-white/15'
                            }`}
                          >
                            {proj.codePrefix || proj.name.slice(0, 3).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">{proj.name}</h3>
                              {isActive && (
                                <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/80 border border-white/10 px-1.5 py-0.2 rounded font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                              {proj.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1.5 font-mono">
                              <span>{proj.creatives?.length || 0} Creatives</span>
                              <span>•</span>
                              <span>{proj.characters?.length || 0} Characters</span>
                              <span>•</span>
                              <span>{proj.creativeMemory?.length || 0} Memory Items</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1.5 shrink-0 ml-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Duplicate structure"
                            onClick={() => {
                              setDuplicateSourceId(proj.id);
                              setName(`${proj.name} (Copy)`);
                              setCodePrefix(`${proj.codePrefix}2`);
                              setView('duplicate');
                            }}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete project"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${proj.name}"?`)) {
                                onDeleteProject(proj.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Quick Template Picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block mb-2">
                  Quick Brand Templates
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickTemplates.map((tpl) => (
                    <button
                      type="button"
                      key={tpl.name}
                      onClick={() => {
                        setName(tpl.name);
                        setCodePrefix(tpl.prefix);
                        setDescription(tpl.desc);
                      }}
                      className="p-3 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {tpl.icon}
                        <span className="text-xs font-bold text-white truncate">{tpl.name}</span>
                      </div>
                      <span className="text-[10px] text-white/40 block mt-1 line-clamp-1">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nootrion, Restaurante X, SaaS Z"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!codePrefix) {
                        setCodePrefix(e.target.value.slice(0, 3).toUpperCase());
                      }
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26] transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NOO"
                    maxLength={4}
                    value={codePrefix}
                    onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-hidden focus:border-[#F27D26] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Brand & Business Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the company, market niche, and creative mission..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          )}

          {view === 'duplicate' && (
            <form onSubmit={handleDuplicateSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-white/60 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#F27D26] shrink-0 mt-0.5" />
                <span>
                  Duplication copies workflow categories, custom recipes, and pipeline settings while keeping
                  brand identity and creative memories completely fresh and isolated.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    New Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26] transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={codePrefix}
                    onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-hidden focus:border-[#F27D26] transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                >
                  Duplicate Structure
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
