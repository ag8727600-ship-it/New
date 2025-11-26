import React, { useState } from 'react';
import { EventPlan, EventType, ChecklistItem } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface InputLabelProps {
  children?: React.ReactNode;
}

const InputLabel: React.FC<InputLabelProps> = ({ children }) => (
    <label className="block text-xs font-bold text-cyan-500 mb-1.5 uppercase tracking-wide">{children}</label>
);

const StyledInput = (props: any) => (
    <input 
      className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 focus:border-cyan-400 outline-none transition text-white placeholder-navy-600 shadow-inner"
      {...props} 
    />
);

export const EventPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Partial<EventPlan>>({
    name: '',
    clientName: '',
    date: '',
    time: '',
    location: '',
    eventType: EventType.WEDDING,
    guestCount: 100,
    bartenderCount: 2,
    checklist: [],
    drinkMenu: ['Gin Tônica', 'Moscow Mule', 'Whisky Sour']
  });

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const list = [...(event.checklist || [])];
    list[index] = { ...list[index], [field]: value };
    setEvent({ ...event, checklist: list });
  };

  const removeChecklistItem = (index: number) => {
    const list = [...(event.checklist || [])];
    list.splice(index, 1);
    setEvent({ ...event, checklist: list });
  };

  const addEmptyItem = (category: ChecklistItem['category']) => {
    const newItem: ChecklistItem = {
      name: '',
      category,
      quantityNeeded: 0,
      quantityPacked: 0,
      notes: '',
      isPacked: false
    };
    setEvent({ ...event, checklist: [...(event.checklist || []), newItem] });
  };

  const addDrinkToMenu = () => {
    setEvent(prev => ({ ...prev, drinkMenu: [...(prev.drinkMenu || []), ''] }));
  };

  const updateDrinkInMenu = (index: number, val: string) => {
    const newMenu = [...(event.drinkMenu || [])];
    newMenu[index] = val;
    setEvent(prev => ({ ...prev, drinkMenu: newMenu }));
  };

  const removeDrinkFromMenu = (index: number) => {
    const newMenu = [...(event.drinkMenu || [])];
    newMenu.splice(index, 1);
    setEvent(prev => ({ ...prev, drinkMenu: newMenu }));
  };

  const generateWithAI = async () => {
    if (!event.guestCount || !event.eventType) return alert("Preencha o nº de convidados e tipo de evento.");
    
    setLoading(true);
    try {
      const jsonStr = await GeminiService.generateEventChecklist(event.guestCount, event.eventType);
      const items = JSON.parse(jsonStr) as ChecklistItem[];
      const checklistItems = items.map(i => ({ ...i, quantityPacked: 0, isPacked: false }));
      setEvent(prev => ({ ...prev, checklist: checklistItems }));
    } catch (e) {
      alert("Erro ao processar sugestão da IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!event.name || !event.date) return alert("Por favor, preencha o Nome do Evento e a Data.");
    
    const newEvent: EventPlan = {
      ...event as EventPlan,
      id: crypto.randomUUID(),
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await StorageService.saveEvent(newEvent);
    navigate(`/checklists/${newEvent.id}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Planejamento de Evento</h2>
        <p className="text-slate-400 mb-8">Monte o escopo, cardápio e checklist estrutural.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Informações Gerais */}
          <div className="lg:col-span-2 bg-navy-800 p-8 rounded-2xl border border-navy-700 shadow-2xl">
            <h3 className="text-white font-bold uppercase text-sm mb-6 border-b border-navy-600 pb-4 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span> Informações Gerais
            </h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <InputLabel>Nome do Contratante</InputLabel>
                  <StyledInput type="text" value={event.clientName} onChange={(e: any) => setEvent({...event, clientName: e.target.value})} placeholder="Ex: João da Silva" />
                </div>
                <div>
                  <InputLabel>Nome do Evento</InputLabel>
                  <StyledInput type="text" value={event.name} onChange={(e: any) => setEvent({...event, name: e.target.value})} placeholder="Ex: Casamento João e Maria" />
                </div>
              </div>

              <div>
                  <InputLabel>Local</InputLabel>
                  <StyledInput type="text" value={event.location} onChange={(e: any) => setEvent({...event, location: e.target.value})} placeholder="Salão de Festas Imperial" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <InputLabel>Data</InputLabel>
                    <StyledInput type="date" value={event.date} onChange={(e: any) => setEvent({...event, date: e.target.value})} />
                 </div>
                 <div>
                    <InputLabel>Hora</InputLabel>
                    <StyledInput type="time" value={event.time || ''} onChange={(e: any) => setEvent({...event, time: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 <div>
                    <InputLabel>Tipo de Evento</InputLabel>
                    <select className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 focus:border-cyan-400 outline-none transition text-white"
                      value={event.eventType} onChange={e => setEvent({...event, eventType: e.target.value as EventType})}>
                      {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div>
                    <InputLabel>Nº Convidados</InputLabel>
                    <StyledInput type="number" value={event.guestCount} onChange={(e: any) => setEvent({...event, guestCount: Number(e.target.value)})} />
                 </div>
                 <div>
                    <InputLabel>Bartenders</InputLabel>
                    <StyledInput type="number" value={event.bartenderCount} onChange={(e: any) => setEvent({...event, bartenderCount: Number(e.target.value)})} />
                 </div>
              </div>
            </div>
          </div>

          {/* Cardápio de Drinks */}
          <div className="lg:col-span-1">
             <div className="bg-gradient-to-br from-navy-900 to-navy-950 h-full rounded-2xl border border-navy-700 shadow-2xl flex flex-col relative overflow-hidden ring-4 ring-navy-800">
                <div className="bg-navy-950 p-6 text-center relative border-b border-amber-500/30">
                   <h3 className="text-amber-500 font-serif font-bold text-2xl tracking-[0.2em] uppercase border-y-2 border-amber-500/50 inline-block px-6 py-2">Menu</h3>
                </div>
                
                <div className="p-8 flex-1 relative">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                   
                   <div className="space-y-6 relative z-10">
                      {event.drinkMenu?.map((drink, idx) => (
                        <div key={idx} className="flex items-end group">
                           <span className="text-amber-500 text-sm font-serif italic mr-3">{idx + 1}</span>
                           <input 
                              type="text" 
                              value={drink} 
                              onChange={(e) => updateDrinkInMenu(idx, e.target.value)}
                              className="flex-1 bg-transparent border-b border-navy-600 text-white font-serif text-lg italic outline-none focus:border-amber-500 px-1 py-1"
                              placeholder="Nome do Drink..."
                           />
                           <button onClick={() => removeDrinkFromMenu(idx)} className="ml-2 text-navy-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                              <i className="fas fa-times"></i>
                           </button>
                        </div>
                      ))}
                      
                      <button onClick={addDrinkToMenu} className="w-full py-3 border border-dashed border-navy-600 text-navy-500 hover:border-amber-500 hover:text-amber-500 rounded-lg transition text-xs uppercase font-bold tracking-widest mt-6">
                         Adicionar Drink
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* AI Action */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-blue-900/50 to-navy-800 p-8 rounded-2xl border border-blue-800/50 mb-10 shadow-lg backdrop-blur-sm">
          <div className="mb-4 md:mb-0">
            <h3 className="text-white font-bold text-xl mb-1 flex items-center"><i className="fas fa-sparkles text-amber-400 mr-2"></i> Assistente Virtual</h3>
            <p className="text-blue-200 text-sm">Gere o checklist completo automaticamente com base no número de convidados.</p>
          </div>
          <button 
            onClick={generateWithAI} 
            disabled={loading}
            className="bg-white text-navy-900 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 w-full md:w-auto transform hover:-translate-y-1">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Gerar Checklist Automático'}
          </button>
        </div>

        {/* Checklist Categories */}
        <div className="space-y-8">
          {['Estrutura', 'Bebida', 'Xarope', 'Insumo', 'Vidraria', 'Utensilio', 'Animacao'].map(category => {
            const items = event.checklist?.filter(i => i.category === category);
            return (
              <div key={category} className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-lg">
                 <div className="bg-navy-900/50 px-8 py-4 flex justify-between items-center border-b border-navy-700">
                    <h4 className="font-bold text-cyan-400 uppercase tracking-widest text-sm flex items-center">
                        <i className="fas fa-layer-group mr-2 opacity-70"></i> {category}
                    </h4>
                    <button onClick={() => addEmptyItem(category as any)} className="text-xs bg-navy-700 hover:bg-navy-600 px-3 py-1.5 rounded-lg text-white transition border border-navy-600">
                        + Item
                    </button>
                 </div>
                 <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="text-slate-500 text-left text-xs uppercase tracking-wide">
                          <th className="pb-3 pl-3 font-semibold">Item</th>
                          <th className="pb-3 w-32 text-center font-semibold">Qtd.</th>
                          <th className="pb-3 pl-3 font-semibold">Notas</th>
                          <th className="pb-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700/50">
                        {items && items.length > 0 ? items.map((item, idx) => {
                           const realIdx = event.checklist!.indexOf(item);
                           return (
                            <tr key={idx} className="group">
                              <td className="py-2 pr-2">
                                <input type="text" value={item.name} 
                                  onChange={e => updateChecklistItem(realIdx, 'name', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 p-2 text-white outline-none transition" placeholder="Nome do item"/>
                              </td>
                              <td className="py-2 pr-2">
                                <input type="number" value={item.quantityNeeded} 
                                  onChange={e => updateChecklistItem(realIdx, 'quantityNeeded', Number(e.target.value))}
                                  className="w-full bg-navy-950 border border-navy-700 rounded p-2 text-amber-500 font-bold text-center focus:border-amber-500 outline-none"/>
                              </td>
                              <td className="py-2 pr-2">
                                <input type="text" value={item.notes || ''} 
                                  onChange={e => updateChecklistItem(realIdx, 'notes', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-slate-500 p-2 text-slate-400 outline-none text-xs italic" placeholder="Obs"/>
                              </td>
                              <td className="py-2 text-center">
                                <button onClick={() => removeChecklistItem(realIdx)} className="text-navy-600 hover:text-red-400 transition"><i className="fas fa-trash"></i></button>
                              </td>
                            </tr>
                           );
                        }) : (
                          <tr><td colSpan={4} className="text-center py-6 text-slate-600 italic bg-navy-900/20 rounded">Nenhum item adicionado.</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-6 mt-12 flex justify-end z-20">
          <div className="bg-navy-900/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-navy-700 flex space-x-4">
             <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white font-medium transition">Cancelar</button>
             <button onClick={savePlan} className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold shadow-lg shadow-green-900/30 flex items-center transform hover:-translate-y-0.5 transition">
               <i className="fas fa-check-circle mr-2"></i> Finalizar Planejamento
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};