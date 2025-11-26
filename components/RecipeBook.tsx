import React, { useState, useEffect } from 'react';
import { Recipe, Unit } from '../types';
import { StorageService } from '../services/storageService';

export const RecipeBook: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe>>({ ingredients: [] });

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    const data = await StorageService.getRecipes();
    setRecipes(data);
  };

  const addIngredient = () => {
    const newIng = { name: '', amount: 0, unit: Unit.ML };
    setCurrentRecipe({
      ...currentRecipe,
      ingredients: [...(currentRecipe.ingredients || []), newIng]
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngs = [...(currentRecipe.ingredients || [])];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setCurrentRecipe({ ...currentRecipe, ingredients: newIngs });
  };

  const removeIngredient = (index: number) => {
    const newIngs = [...(currentRecipe.ingredients || [])];
    newIngs.splice(index, 1);
    setCurrentRecipe({ ...currentRecipe, ingredients: newIngs });
  };

  const handleSave = async () => {
    if (!currentRecipe.name) return;
    const recipeToSave = {
      ...currentRecipe,
      id: currentRecipe.id || crypto.randomUUID(),
    } as Recipe;
    await StorageService.saveRecipe(recipeToSave);
    setShowModal(false);
    loadRecipes();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white">Livro de Receitas</h2>
          <p className="text-slate-400 text-sm">Fichas técnicas e modos de preparo.</p>
        </div>
        <button onClick={() => { setCurrentRecipe({ ingredients: [] }); setShowModal(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-xl transition shadow-lg shadow-amber-900/30 font-bold">
          <i className="fas fa-plus mr-2"></i> Nova Receita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-6 hover:border-amber-500/50 transition duration-300 shadow-xl group hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-serif group-hover:text-amber-500 transition">{recipe.name}</h3>
                <span className="text-xs text-cyan-400 uppercase tracking-wide font-bold bg-navy-900 px-2 py-0.5 rounded">{recipe.category}</span>
              </div>
              <div className="text-slate-500">
                <button onClick={() => { setCurrentRecipe(recipe); setShowModal(true); }} className="hover:text-blue-400 mr-3"><i className="fas fa-edit"></i></button>
                <button onClick={async () => { if(confirm('Excluir?')) { await StorageService.deleteRecipe(recipe.id); loadRecipes(); }}} className="hover:text-red-400"><i className="fas fa-trash"></i></button>
              </div>
            </div>
            
            <div className="mb-4 bg-navy-900/50 p-4 rounded-xl border border-navy-700/50">
              <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Ingredientes</p>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-sm text-slate-200 flex justify-between border-b border-navy-800/50 pb-1 last:border-0">
                    <span>{ing.name}</span>
                    <span className="text-amber-500 font-medium">{ing.amount}{ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-sm text-slate-400 mb-4">
              <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Preparo</p>
              <p className="line-clamp-3 leading-relaxed">{recipe.instructions}</p>
            </div>
            <div className="pt-4 border-t border-navy-700 flex items-center text-xs text-slate-500 font-medium">
               <i className="fas fa-wine-glass mr-2 text-cyan-500"></i> {recipe.glassware}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy-950/90 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-navy-800 p-8 rounded-2xl w-full max-w-2xl border border-navy-600 my-10 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-navy-700 pb-4">{currentRecipe.id ? 'Editar Receita' : 'Nova Receita'}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                  <label className="text-xs text-cyan-400 font-bold uppercase">Nome do Drink</label>
                  <input type="text" className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-white focus:border-cyan-400 outline-none" 
                     value={currentRecipe.name || ''} onChange={e => setCurrentRecipe({...currentRecipe, name: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-slate-500 font-bold uppercase">Categoria</label>
                  <input type="text" className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-white focus:border-cyan-400 outline-none" 
                     value={currentRecipe.category || ''} onChange={e => setCurrentRecipe({...currentRecipe, category: e.target.value})} />
               </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-500 font-bold uppercase">Copo/Taça Recomendado</label>
              <input type="text" className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-white focus:border-cyan-400 outline-none" 
                 value={currentRecipe.glassware || ''} onChange={e => setCurrentRecipe({...currentRecipe, glassware: e.target.value})} />
            </div>

            <div className="mb-4 bg-navy-900/30 p-4 rounded-xl border border-navy-700">
               <div className="flex justify-between items-center mb-3">
                 <label className="text-xs text-amber-500 font-bold uppercase">Ingredientes</label>
                 <button onClick={addIngredient} className="text-xs bg-navy-700 px-3 py-1.5 rounded-lg text-white hover:bg-navy-600 transition">
                   + Adicionar
                 </button>
               </div>
               <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-navy-600">
                 {currentRecipe.ingredients?.map((ing, idx) => (
                   <div key={idx} className="flex gap-2">
                      <input placeholder="Nome" className="flex-1 bg-navy-900 border border-navy-700 p-2 rounded text-white text-sm focus:border-amber-500 outline-none" 
                        value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} />
                      <input placeholder="Qtd" type="number" className="w-20 bg-navy-900 border border-navy-700 p-2 rounded text-white text-sm text-center" 
                        value={ing.amount} onChange={e => updateIngredient(idx, 'amount', Number(e.target.value))} />
                      <select className="w-20 bg-navy-900 border border-navy-700 p-2 rounded text-white text-sm"
                        value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)}>
                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button onClick={() => removeIngredient(idx)} className="text-red-500 hover:text-red-400 px-2"><i className="fas fa-times"></i></button>
                   </div>
                 ))}
               </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-500 font-bold uppercase">Modo de Preparo</label>
              <textarea rows={4} className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-white focus:border-cyan-400 outline-none" 
                 value={currentRecipe.instructions || ''} onChange={e => setCurrentRecipe({...currentRecipe, instructions: e.target.value})}></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-slate-400 hover:text-white transition">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20">Salvar Receita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};