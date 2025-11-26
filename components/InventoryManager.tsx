import React, { useState, useEffect } from 'react';
import { InventoryItem, Unit } from '../types';
import { StorageService } from '../services/storageService';

export const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await StorageService.getInventory();
    setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentItem.name || !currentItem.quantity) return;
    
    const newItem: InventoryItem = {
      id: currentItem.id || crypto.randomUUID(),
      name: currentItem.name,
      category: currentItem.category || 'Outro',
      quantity: Number(currentItem.quantity),
      minStock: Number(currentItem.minStock || 0),
      unit: currentItem.unit || Unit.UNIT,
      updatedAt: new Date().toISOString()
    };

    await StorageService.saveInventoryItem(newItem);
    setShowModal(false);
    loadInventory();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await StorageService.deleteInventoryItem(id);
      loadInventory();
    }
  };

  const openModal = (item?: InventoryItem) => {
    const defaultCat = filterCategory !== 'Todos' ? filterCategory : 'Destilado';
    setCurrentItem(item || { category: defaultCat, unit: Unit.UNIT });
    setShowModal(true);
  };

  const getCategoryTotal = (cat: string) => {
    let filtered = items;
    if (cat !== 'Todos') {
      filtered = items.filter(i => i.category === cat);
    }
    return filtered.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const filteredItems = filterCategory === 'Todos' 
    ? items 
    : items.filter(i => i.category === filterCategory);

  const categories = [
    'Todos', 'Destilado', 'Fermentado', 'Xarope', 'Insumo', 'Vidraria', 'Copos', 'Taças', 'Balcões', 'Iluminação', 'Animação', 'Decoração', 'Utensilio', 'Outro'
  ];

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Destilado': return 'fa-wine-bottle';
      case 'Fermentado': return 'fa-beer';
      case 'Vidraria': return 'fa-glass-martini-alt';
      case 'Copos': return 'fa-glass-whiskey';
      case 'Taças': return 'fa-wine-glass';
      case 'Balcões': return 'fa-dungeon';
      case 'Iluminação': return 'fa-lightbulb';
      case 'Animação': return 'fa-music';
      case 'Decoração': return 'fa-holly-berry';
      case 'Utensilio': return 'fa-tools';
      case 'Xarope': return 'fa-prescription-bottle';
      case 'Insumo': return 'fa-lemon';
      default: return '';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-serif font-bold text-white">
             {filterCategory === 'Todos' ? 'Inventário Geral' : `Controle de ${filterCategory}`}
           </h2>
           <p className="text-slate-400 text-sm mt-1">Gestão de estoque, quebras e reposição.</p>
        </div>
        <button onClick={() => openModal()} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-6 py-3 rounded-xl transition shadow-lg shadow-amber-900/30 flex items-center font-bold">
          <i className="fas fa-plus mr-2"></i> Novo Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-navy-600 scrollbar-track-navy-900">
        {categories.map(cat => {
          const icon = getCategoryIcon(cat);
          const total = getCategoryTotal(cat);
          const isActive = filterCategory === cat;

          return (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center border ${
                isActive 
                  ? 'bg-cyan-500 text-navy-900 border-cyan-400 shadow-[0_0_15px_rgba(100,255,218,0.3)]' 
                  : 'bg-navy-800 text-slate-400 border-navy-700 hover:bg-navy-700 hover:text-white'
              }`}
            >
              {icon && <i className={`fas ${icon} mr-2 ${isActive ? 'text-navy-900' : 'text-slate-500'}`}></i>}
              {cat}
              <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-navy-900 text-cyan-400' : 'bg-navy-950 text-slate-500'
              }`}>
                  {total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-navy-900 text-slate-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 w-1/3">Item</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-center">Status Estoque</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700 text-slate-300">
            {loading ? (
               <tr><td colSpan={4} className="p-12 text-center text-cyan-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
            ) : filteredItems.length === 0 ? (
               <tr><td colSpan={4} className="p-12 text-center text-slate-500 italic">Nenhum item nesta categoria.</td></tr>
            ) : filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-navy-700/50 transition duration-200 group">
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-base group-hover:text-cyan-400 transition">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Atualizado: {new Date(item.updatedAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border border-navy-600 bg-navy-700 text-slate-300`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className={`text-xl font-bold ${item.quantity <= item.minStock ? 'text-red-400' : 'text-green-400'}`}>
                      {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </span>
                    {item.quantity <= item.minStock && (
                       <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider bg-red-900/30 border border-red-900/50 px-2 py-0.5 rounded mt-1 animate-pulse">Repor</span>
                    )}
                     <span className="text-[10px] text-slate-600 mt-1">Mín: {item.minStock}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center space-x-2 opacity-60 group-hover:opacity-100 transition">
                    <button onClick={() => openModal(item)} className="bg-navy-900 hover:bg-blue-900/30 text-blue-400 p-2 rounded-lg border border-navy-600 hover:border-blue-500 transition" title="Editar">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="bg-navy-900 hover:bg-red-900/30 text-red-400 p-2 rounded-lg border border-navy-600 hover:border-red-500 transition" title="Excluir">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy-950/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-navy-800 p-8 rounded-2xl w-full max-w-lg border border-navy-600 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-navy-700 pb-4">
              {currentItem.id ? 'Editar Item' : 'Novo Item'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wide">Nome do Item</label>
                <input 
                  type="text" 
                  value={currentItem.name || ''} 
                  onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                  className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg p-3 focus:border-cyan-400 outline-none transition shadow-inner"
                  placeholder="Ex: Taça de Gin Cristal"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Categoria</label>
                  <select 
                     value={currentItem.category}
                     onChange={e => setCurrentItem({...currentItem, category: e.target.value})}
                     className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg p-3 outline-none focus:border-cyan-400"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Unidade</label>
                  <select 
                     value={currentItem.unit}
                     onChange={e => setCurrentItem({...currentItem, unit: e.target.value as Unit})}
                     className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg p-3 outline-none focus:border-cyan-400"
                  >
                    {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                <div>
                  <label className="block text-xs font-bold text-amber-500 mb-2 uppercase tracking-wide">Qtd. Atual</label>
                  <input 
                    type="number" 
                    value={currentItem.quantity || ''} 
                    onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})}
                    className="w-full bg-navy-950 border border-navy-700 text-white rounded p-2 focus:border-amber-500 outline-none text-center font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Alerta Mínimo</label>
                  <input 
                    type="number" 
                    value={currentItem.minStock || ''} 
                    onChange={e => setCurrentItem({...currentItem, minStock: Number(e.target.value)})}
                    className="w-full bg-navy-950 border border-navy-700 text-white rounded p-2 focus:border-cyan-400 outline-none text-center"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-400 hover:text-white font-medium transition">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-900/20 transition transform hover:-translate-y-1">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};