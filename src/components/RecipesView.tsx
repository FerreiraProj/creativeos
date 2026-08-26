import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  FileCode,
  Sliders,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { Project, Recipe, RecipeStep } from '../types';
import { PRESET_RECIPES } from '../lib/constants';

interface RecipesViewProps {
  project: Project;
  onUpdateCustomRecipes: (recipes: Recipe[]) => void;
  onSelectRecipeForStudio: (recipe: Recipe) => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  project,
  onUpdateCustomRecipes,
  onSelectRecipeForStudio,
}) => {
  const customRecipes = project.customRecipes || [];
  const allRecipes = [...PRESET_RECIPES, ...customRecipes];

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(PRESET_RECIPES[0]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // New Custom Recipe Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('25s');
  const [steps, setSteps] = useState<RecipeStep[]>([
    {
      stepNumber: 1,
      name: 'Initial Hook (0-5s)',
      description: 'Capture attention in first 3 seconds.',
      provider: 'Gemini Script AI',
      defaultDurationSec: 5,
      promptTemplate: 'Generate high-impact scroll stopper.',
    },
    {
      stepNumber: 2,
      name: 'Multi-Shot Production',
      description: 'Generate talking head video shots.',
      provider: 'Gemini Omni / Fal.ai',
      defaultDurationSec: 5,
      promptTemplate: 'Render character shots using anchor photo.',
    },
    {
      stepNumber: 3,
      name: 'Final Assembly',
      description: 'Stitch shots and add captions.',
      provider: 'Vite Compositor',
      promptTemplate: 'Composite sequence.',
    },
  ]);

  const handleSaveCustomRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRecipe: Recipe = {
      id: 'recipe-custom-' + Date.now(),
      name: name.trim(),
      description: description.trim() || 'Custom production workflow.',
      isCustom: true,
      iconName: 'Sparkles',
      estimatedDuration,
      inputRequirements: ['Script Outline', 'Target Angle'],
      steps,
    };

    const updated = [...customRecipes, newRecipe];
    onUpdateCustomRecipes(updated);
    setSelectedRecipe(newRecipe);
    setIsCreatingCustom(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#F27D26]">
              <Layers className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              Production Recipes
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Standardized production blueprints that define how content types are decomposed, prompted, and synthesized by AI models.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCustom(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-[#F27D26]" />
          <span>New Recipe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recipe List Selector (Col 4) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block px-1">
            Available Blueprints ({allRecipes.length})
          </span>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {allRecipes.map((recipe) => {
              const isSelected = selectedRecipe.id === recipe.id;
              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setIsCreatingCustom(false);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#141414] border-[#F27D26] shadow-sm'
                      : 'bg-[#0F0F0F] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        recipe.isCustom
                          ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {recipe.isCustom ? 'Custom' : 'Preset'}
                    </span>
                    <span className="text-[11px] text-white/40 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-white/40" />
                      {recipe.estimatedDuration}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">{recipe.name}</h3>
                  <p className="text-[11px] text-white/50 line-clamp-2">{recipe.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recipe Inspector & Workflow Diagram (Col 7) */}
        <div className="lg:col-span-7">
          {isCreatingCustom ? (
            /* Custom Recipe Creation Form */
            <form
              onSubmit={handleSaveCustomRecipe}
              className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-serif italic text-white">Create Custom Production Recipe</h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nootrion — Scientific Reel Breakdown"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                    Target Duration
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1">
                  Workflow Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain the production logic of this recipe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#F27D26]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-4 py-2 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60 rounded-lg hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition cursor-pointer"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          ) : (
            /* Selected Recipe Detail View */
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                      Active Blueprint
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      Duration: {selectedRecipe.estimatedDuration}
                    </span>
                  </div>
                  <h2 className="text-lg font-serif italic text-white mt-1.5">{selectedRecipe.name}</h2>
                  <p className="text-xs text-white/50 mt-1">{selectedRecipe.description}</p>
                </div>

                <button
                  onClick={() => onSelectRecipeForStudio(selectedRecipe)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-sm shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Use in Studio</span>
                </button>
              </div>

              {/* Step Sequence Flow */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-white block">
                  Step-by-Step Processing Pipeline ({selectedRecipe.steps?.length || 0} Stages)
                </span>

                <div className="space-y-2.5">
                  {selectedRecipe.steps?.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl bg-black/60 border border-white/5 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 text-[#F27D26] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        {step.stepNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{step.name}</h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                            {step.provider}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-1">{step.description}</p>
                        <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[10px] text-white/60 font-mono">
                          <span className="text-[#F27D26] font-semibold">Prompt: </span>
                          {step.promptTemplate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
