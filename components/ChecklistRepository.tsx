import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventPlan, StaffShift, EventType, ChecklistItem, Unit } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';

export const ChecklistRepository: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'analytics' | 'staff'>('checklist');
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<EventPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [currentShift, setCurrentShift] = useState<Partial<StaffShift>>({});

  useEffect(() => { loadEvents(); }, [id]);
  
  // Sync editedEvent when selectedEvent changes or editing starts
  useEffect(() => { 
    if (selectedEvent) {
        setEditedEvent(JSON.parse(JSON.stringify(selectedEvent)));
    }
  }, [selectedEvent, isEditing]);

  const loadEvents = async () => {
    setLoading(true);
    const allEvents = await StorageService.getEvents();
    setEvents(allEvents);
    if (id) {
      const found = allEvents.find(e => e.id === id);
      if (found) setSelectedEvent(found);
    } else {
      setSelectedEvent(null);
    }
    setLoading(false);
  };

  // FIX: Manual Date Parsing to avoid Timezone offsets
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    try {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; 
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateStr;
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventPlan) => {
     await StorageService.saveEvent(updatedEvent);
     setSelectedEvent({...updatedEvent});
     // Refresh list to update sidebar if needed
     const allEvents = await StorageService.getEvents();
     setEvents(allEvents);
  };

  const saveEdit = async () => {
      if (editedEvent) {
          await handleUpdateEvent(editedEvent);
          setIsEditing(false);
      }
  };

  const cancelEdit = () => {
      if (selectedEvent) setEditedEvent(JSON.parse(JSON.stringify(selectedEvent)));
      setIsEditing(false);
  };

  const generateWithAI = async () => {
    if (!editedEvent) return;
    if (!confirm(`Atenção: A IA irá sugerir quantidades para ${editedEvent.guestCount} convidados e adicionar itens faltantes. Itens existentes serão atualizados. Continuar?`)) return;
    
    setAiLoading(true);
    try {
      const jsonStr = await GeminiService.generateEventChecklist(editedEvent.guestCount, editedEvent.eventType);
      const generatedItems = JSON.parse(jsonStr) as ChecklistItem[];
      
      const updatedChecklist = [...editedEvent.checklist];
      
      generatedItems.forEach(genItem => {
         const existingIndex = updatedChecklist.findIndex(i => i.name.toLowerCase() === genItem.name.toLowerCase() && i.category === genItem.category);
         
         if (existingIndex >= 0) {
             // Update quantity of existing item
             updatedChecklist[existingIndex].quantityNeeded = genItem.quantityNeeded;
         } else {
             // Add new item
             updatedChecklist.push({ ...genItem, quantityPacked: 0, isPacked: false });
         }
      });
      
      setEditedEvent({ ...editedEvent, checklist: updatedChecklist });
    } catch (e) { 
        alert("Erro ao comunicar com a IA."); 
    } finally { 
        setAiLoading(false); 
    }
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
      if (!editedEvent) return;
      const list = [...editedEvent.checklist];
      list[index] = { ...list[index], [field]: value };
      setEditedEvent({ ...editedEvent, checklist: list });
  };

  const removeChecklistItem = (index: number) => {
      if (!editedEvent) return;
      const list = [...editedEvent.checklist];
      list.splice(index, 1);
      setEditedEvent({ ...editedEvent, checklist: list });
  };

  const addChecklistItem = (category: string) => {
      if (!editedEvent) return;
      const newItem: ChecklistItem = { name: '', category: category as any, quantityNeeded: 0, quantityPacked: 0, notes: '', isPacked: false };
      setEditedEvent({ ...editedEvent, checklist: [...editedEvent.checklist, newItem] });
  };

  // Fixed Logic for Check/Uncheck without reload
  const togglePackedByIndex = async (index: number) => {
      if(!selectedEvent) return;
      const newChecklist = [...selectedEvent.checklist];
      newChecklist[index] = { 
          ...newChecklist[index], 
          isPacked: !newChecklist[index].isPacked 
      };
      
      const updatedEvent = { ...selectedEvent, checklist: newChecklist };
      
      // Optimistic update
      setSelectedEvent(updatedEvent);
      // Persist
      await StorageService.saveEvent(updatedEvent);
  }

  const updateDrink = (index: number, val: string) => {
      if(!editedEvent) return;
      const menu = [...(editedEvent.drinkMenu || [])];
      menu[index] = val;
      setEditedEvent({...editedEvent, drinkMenu: menu});
  };

  const addDrink = () => {
      if(!editedEvent) return;
      setEditedEvent({...editedEvent, drinkMenu: [...(editedEvent.drinkMenu || []), '']});
  };

  const removeDrink = (index: number) => {
      if(!editedEvent) return;
      const menu = [...(editedEvent.drinkMenu || [])];
      menu.splice(index, 1);
      setEditedEvent({...editedEvent, drinkMenu: menu});
  };

  // --- Staff Logic ---
  const handleSaveShift = async () => {
    if (!selectedEvent || !currentShift.name || !currentShift.role) return;
    
    const newShift: StaffShift = {
      id: currentShift.id || crypto.randomUUID(),
      name: currentShift.name,
      role: currentShift.role as any,
      startTime: currentShift.startTime || '18:00',
      endTime: currentShift.endTime || '02:00',
      hourlyRate: Number(currentShift.hourlyRate || 0)
    };

    const updatedStaff = [...(selectedEvent.staff || [])];
    const idx = updatedStaff.findIndex(s => s.id === newShift.id);
    
    if (idx >= 0) {
        updatedStaff[idx] = newShift;
    } else {
        updatedStaff.push(newShift);
    }

    await handleUpdateEvent({ ...selectedEvent, staff: updatedStaff });
    setShowStaffModal(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!selectedEvent || !confirm('Remover este funcionário da escala?')) return;
    const updatedStaff = selectedEvent.staff.filter(s => s.id !== shiftId);
    await handleUpdateEvent({ ...selectedEvent, staff: updatedStaff });
  };

  const openStaffModal = (shift?: StaffShift) => {
      setCurrentShift(shift || { role: 'Bartender', startTime: selectedEvent?.time || '19:00', endTime: '03:00' });
      setShowStaffModal(true);
  };

  // --- Calculations ---
  const getTotalPacked = () => selectedEvent?.checklist.filter(i => i.isPacked).length || 0;
  const getTotalItems = () => selectedEvent?.checklist.length || 0;
  const getProgress = () => getTotalItems() === 0 ? 0 : Math.round((getTotalPacked() / getTotalItems()) * 100);

  if (loading) return <div className="p-12 text-center text-cyan-400"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* Sidebar List */}
      <div className="w-full md:w-80 bg-navy-900 border-r border-navy-700 flex flex-col h-[300px] md:h-auto overflow-y-auto">
        <div className="p-6 border-b border-navy-700 bg-navy-950/50 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white font-serif">Meus Eventos</h2>
          <button onClick={() => navigate('/planner')} className="mt-4 w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center">
            <i className="fas fa-plus mr-2"></i> Novo Evento
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {events.map(evt => (
            <div 
              key={evt.id} 
              onClick={() => { setSelectedEvent(evt); setIsEditing(false); navigate(`/checklists/${evt.id}`); }}
              className={`p-5 border-b border-navy-800 cursor-pointer transition hover:bg-navy-800 group ${selectedEvent?.id === evt.id ? 'bg-navy-800 border-l-4 border-l-cyan-400' : 'border-l-4 border-l-transparent'}`}
            >
              <h3 className={`font-bold text-sm mb-1 ${selectedEvent?.id === evt.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{evt.name}</h3>
              <p className="text-xs text-slate-500 flex justify-between">
                <span>{formatDate(evt.date)}</span>
                <span className={`px-1.5 rounded ${evt.status === 'Completed' ? 'bg-green-900 text-green-400' : 'bg-amber-900/30 text-amber-500'}`}>{evt.status === 'Completed' ? 'Concluído' : evt.status === 'Confirmed' ? 'Confirmado' : 'Rascunho'}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-navy-950 overflow-y-auto h-screen">
        {selectedEvent ? (
          <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">
            
            {/* Header / Edit Form */}
            <div className="bg-navy-800 rounded-2xl shadow-xl border border-navy-700 p-6 md:p-8 mb-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
               
               <div className="flex justify-between items-start mb-6">
                 <div className="w-full">
                   {isEditing && editedEvent ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <input className="text-2xl font-bold bg-navy-900 border border-navy-600 rounded p-2 text-white w-full" 
                          value={editedEvent.name} onChange={e => setEditedEvent({...editedEvent, name: e.target.value})} placeholder="Nome do Evento" />
                       <input className="text-sm bg-navy-900 border border-navy-600 rounded p-2 text-slate-300 w-full" 
                          value={editedEvent.clientName} onChange={e => setEditedEvent({...editedEvent, clientName: e.target.value})} placeholder="Cliente" />
                     </div>
                   ) : (
                     <>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{selectedEvent.name}</h1>
                        <p className="text-lg text-cyan-400 font-medium mb-1">{selectedEvent.clientName}</p>
                     </>
                   )}
                   
                   <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-2">
                      {isEditing && editedEvent ? (
                        <>
                           <div className="flex items-center space-x-2"><i className="far fa-calendar"></i><input type="date" className="bg-navy-900 border border-navy-600 rounded px-2 py-1" value={editedEvent.date} onChange={e => setEditedEvent({...editedEvent, date: e.target.value})} /></div>
                           <div className="flex items-center space-x-2"><i className="far fa-clock"></i><input type="time" className="bg-navy-900 border border-navy-600 rounded px-2 py-1" value={editedEvent.time} onChange={e => setEditedEvent({...editedEvent, time: e.target.value})} /></div>
                           <div className="flex items-center space-x-2"><i className="fas fa-map-marker-alt"></i><input className="bg-navy-900 border border-navy-600 rounded px-2 py-1 w-32" value={editedEvent.location} onChange={e => setEditedEvent({...editedEvent, location: e.target.value})} /></div>
                           <div className="flex items-center space-x-2"><i className="fas fa-users"></i><input type="number" className="bg-navy-900 border border-navy-600 rounded px-2 py-1 w-20" value={editedEvent.guestCount} onChange={e => setEditedEvent({...editedEvent, guestCount: Number(e.target.value)})} /></div>
                           <div className="flex items-center space-x-2"><i className="fas fa-user-tie"></i><input type="number" className="bg-navy-900 border border-navy-600 rounded px-2 py-1 w-16" value={editedEvent.bartenderCount} onChange={e => setEditedEvent({...editedEvent, bartenderCount: Number(e.target.value)})} /></div>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center"><i className="far fa-calendar mr-2 text-amber-500"></i> {formatDate(selectedEvent.date)}</span>
                          <span className="flex items-center"><i className="far fa-clock mr-2 text-amber-500"></i> {selectedEvent.time || '19:00'}</span>
                          <span className="flex items-center"><i className="fas fa-map-marker-alt mr-2 text-amber-500"></i> {selectedEvent.location}</span>
                          <span className="flex items-center"><i className="fas fa-users mr-2 text-amber-500"></i> {selectedEvent.guestCount} convidados</span>
                          <span className="flex items-center"><i className="fas fa-user-tie mr-2 text-amber-500"></i> {selectedEvent.bartenderCount || 2} bartenders</span>
                        </>
                      )}
                   </div>
                 </div>

                 {/* Edit Buttons */}
                 <div className="flex-shrink-0 ml-4">
                   {isEditing ? (
                     <div className="flex flex-col space-y-2">
                        <button onClick={saveEdit} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg text-xs uppercase tracking-wide transition">
                           <i className="fas fa-save mr-2"></i> Salvar
                        </button>
                        <button onClick={cancelEdit} className="bg-navy-700 hover:bg-navy-600 text-slate-300 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition">
                           Cancelar
                        </button>
                     </div>
                   ) : (
                     <button onClick={() => setIsEditing(true)} className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded-lg font-bold border border-navy-600 shadow-lg text-xs uppercase tracking-wide transition flex items-center">
                        <i className="fas fa-edit mr-2"></i> Editar
                     </button>
                   )}
                 </div>
               </div>
               
               {/* Progress Bar */}
               {!isEditing && (
                 <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                       <span className="text-slate-400">Progresso do Checklist</span>
                       <span className="text-cyan-400">{getProgress()}% Concluído</span>
                    </div>
                    <div className="h-2 bg-navy-900 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000" style={{width: `${getProgress()}%`}}></div>
                    </div>
                 </div>
               )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-6 bg-navy-900 p-1 rounded-xl w-fit">
               <button onClick={() => setActiveTab('checklist')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'checklist' ? 'bg-navy-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Checklist Geral</button>
               <button onClick={() => setActiveTab('staff')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'staff' ? 'bg-navy-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Escala & Staff</button>
               <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'analytics' ? 'bg-navy-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Análise</button>
            </div>

            {/* Content Tabs */}
            {activeTab === 'checklist' && (
              <div className="space-y-8">
                 
                  {/* AI & Menu Section */}
                  <div className="space-y-6">
                     {/* AI Assistant Block */}
                     {isEditing && (
                       <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl flex items-center justify-between">
                          <div>
                             <h4 className="font-bold text-blue-300"><i className="fas fa-robot mr-2"></i>Assistente IA</h4>
                             <p className="text-xs text-blue-200/70">Recalcular quantidades baseadas nos convidados.</p>
                          </div>
                          <button onClick={generateWithAI} disabled={aiLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition">
                             {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Gerar Sugestões'}
                          </button>
                       </div>
                     )}

                     {/* Carta de Drinks - Moved to Top */}
                     <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><i className="fas fa-cocktail text-9xl"></i></div>
                        <h3 className="text-white font-serif font-bold text-xl mb-4 border-b border-navy-600 pb-2 relative z-10">Carta de Drinks</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                           {(isEditing && editedEvent ? editedEvent.drinkMenu : selectedEvent.drinkMenu)?.map((drink, idx) => (
                              <div key={idx} className="flex items-center bg-navy-900/50 p-2 rounded-lg border border-navy-700/50">
                                 <span className="text-amber-500 font-serif italic mr-2 text-lg">#{idx+1}</span>
                                 {isEditing ? (
                                    <div className="flex flex-1 space-x-2">
                                       <input className="bg-navy-900/80 border border-navy-600 rounded px-2 py-1 text-sm text-white flex-1 outline-none" value={drink} onChange={e => updateDrink(idx, e.target.value)} />
                                       <button onClick={() => removeDrink(idx)} className="text-red-400 hover:text-red-300"><i className="fas fa-times"></i></button>
                                    </div>
                                 ) : (
                                    <span className="text-slate-300 flex-1">{drink}</span>
                                 )}
                              </div>
                           ))}
                           {isEditing && (
                              <button onClick={addDrink} className="py-2 border border-dashed border-navy-600 text-slate-500 hover:text-cyan-400 text-xs uppercase font-bold rounded flex items-center justify-center hover:bg-navy-900/50 transition">
                                 + Add Drink
                              </button>
                           )}
                           {(!selectedEvent.drinkMenu || selectedEvent.drinkMenu.length === 0) && !isEditing && (
                              <p className="text-slate-500 italic text-sm col-span-full">Cardápio não definido.</p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Checklist Categories */}
                  <div className="space-y-6">
                    {['Estrutura', 'Bebida', 'Xarope', 'Insumo', 'Vidraria', 'Utensilio', 'Animacao'].map(cat => {
                       const currentList = isEditing && editedEvent ? editedEvent.checklist : selectedEvent.checklist;
                       const items = currentList.filter(i => i.category === cat);
                       
                       return (
                         <div key={cat} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-md">
                           <div className="bg-navy-900/50 px-6 py-3 border-b border-navy-700 flex justify-between items-center">
                              <h3 className="font-bold text-slate-300 uppercase text-xs tracking-widest">{cat}</h3>
                              {isEditing && <button onClick={() => addChecklistItem(cat)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold">+ Add</button>}
                           </div>
                           <div className="divide-y divide-navy-700/50">
                             {items.length === 0 && <p className="p-4 text-center text-slate-600 text-sm italic">Nenhum item nesta categoria.</p>}
                             {items.map((item, idx) => {
                                // Find real index for update functions
                                const realIdx = currentList.indexOf(item);
                                return (
                                 <div key={idx} className={`p-4 flex items-center justify-between group ${item.isPacked && !isEditing ? 'bg-navy-900/30' : 'hover:bg-navy-700/20'}`}>
                                   <div className="flex items-center space-x-4 flex-1">
                                      {!isEditing && (
                                        <button onClick={() => togglePackedByIndex(realIdx)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition cursor-pointer ${item.isPacked ? 'bg-green-500 border-green-500 text-navy-900' : 'border-slate-600 hover:border-cyan-400'}`}>
                                           {item.isPacked && <i className="fas fa-check text-xs"></i>}
                                        </button>
                                      )}
                                      <div className="flex-1">
                                         {isEditing ? (
                                           <div className="flex space-x-2">
                                              <input className="bg-navy-900 border border-navy-600 rounded px-2 py-1 text-sm text-white w-full" value={item.name} onChange={e => updateChecklistItem(realIdx, 'name', e.target.value)} placeholder="Item" />
                                              <input className="bg-navy-900 border border-navy-600 rounded px-2 py-1 text-sm text-amber-500 w-20 text-center font-bold" type="number" value={item.quantityNeeded} onChange={e => updateChecklistItem(realIdx, 'quantityNeeded', Number(e.target.value))} />
                                           </div>
                                         ) : (
                                           <div>
                                             <p className={`font-medium ${item.isPacked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.name}</p>
                                             {item.notes && <p className="text-xs text-slate-500 italic">{item.notes}</p>}
                                           </div>
                                         )}
                                      </div>
                                   </div>
                                   <div className="text-right pl-4">
                                      {!isEditing && <span className="text-amber-500 font-bold text-sm">{item.quantityNeeded}</span>}
                                      {isEditing && (
                                         <button onClick={() => removeChecklistItem(realIdx)} className="text-navy-600 hover:text-red-400 ml-2"><i className="fas fa-trash"></i></button>
                                      )}
                                   </div>
                                 </div>
                                );
                             })}
                           </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 md:p-8 shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white"><i className="fas fa-users-cog mr-2 text-cyan-400"></i>Escala de Funcionários</h3>
                    <button onClick={() => openStaffModal()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-lg transition">
                       + Adicionar Staff
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedEvent.staff || []).map(shift => (
                       <div key={shift.id} className="bg-navy-900 border border-navy-700 p-4 rounded-xl flex justify-between items-center group hover:border-cyan-500/30 transition">
                          <div>
                             <h4 className="font-bold text-white text-lg">{shift.name}</h4>
                             <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-navy-950 px-2 py-0.5 rounded border border-navy-800">{shift.role}</span>
                             <div className="mt-2 text-sm text-slate-400 font-mono">
                                <i className="far fa-clock mr-1 text-amber-500"></i> {shift.startTime} - {shift.endTime}
                             </div>
                          </div>
                          <div className="flex flex-col space-y-2 opacity-50 group-hover:opacity-100 transition">
                             <button onClick={() => openStaffModal(shift)} className="text-blue-400 hover:text-blue-300 bg-navy-950 p-2 rounded border border-navy-700"><i className="fas fa-edit"></i></button>
                             <button onClick={() => handleDeleteShift(shift.id)} className="text-red-400 hover:text-red-300 bg-navy-950 p-2 rounded border border-navy-700"><i className="fas fa-trash"></i></button>
                          </div>
                       </div>
                    ))}
                    {(selectedEvent.staff || []).length === 0 && (
                       <div className="col-span-2 text-center py-12 border-2 border-dashed border-navy-700 rounded-xl text-slate-600">
                          <i className="fas fa-user-friends text-3xl mb-3"></i>
                          <p>Nenhum funcionário escalado ainda.</p>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 shadow-xl">
                     <h3 className="text-lg font-bold text-white mb-4">Progresso por Categoria</h3>
                     <div className="space-y-4">
                        {['Bebida', 'Vidraria', 'Insumo', 'Estrutura'].map(cat => {
                           const items = selectedEvent.checklist.filter(i => i.category === cat);
                           const total = items.length;
                           const packed = items.filter(i => i.isPacked).length;
                           const pct = total === 0 ? 0 : Math.round((packed/total)*100);
                           return (
                              <div key={cat}>
                                 <div className="flex justify-between text-xs font-bold uppercase mb-1">
                                    <span className="text-slate-400">{cat}</span>
                                    <span className={pct === 100 ? 'text-green-400' : 'text-slate-300'}>{packed}/{total}</span>
                                 </div>
                                 <div className="h-1.5 bg-navy-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500" style={{width: `${pct}%`}}></div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 shadow-xl flex flex-col justify-center items-center text-center">
                      <div className="w-32 h-32 rounded-full border-8 border-navy-700 flex items-center justify-center relative mb-4">
                         <div className="absolute inset-0 border-8 border-amber-500 rounded-full" style={{clipPath: `inset(${100 - getProgress()}% 0 0 0)`}}></div>
                         <span className="text-2xl font-bold text-white">{getProgress()}%</span>
                      </div>
                      <h3 className="text-white font-bold">Status Geral</h3>
                      <p className="text-slate-400 text-sm mt-1">
                         {getProgress() === 100 ? 'Tudo pronto para o evento!' : 'Ainda há itens pendentes.'}
                      </p>
                  </div>
               </div>
            )}

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <i className="fas fa-glass-cheers text-6xl mb-4 text-navy-800"></i>
            <p>Selecione um evento para gerenciar</p>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-navy-800 rounded-2xl border border-navy-600 p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-navy-700 pb-2">Gerenciar Staff</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-cyan-400 font-bold uppercase">Nome</label>
                    <input className="w-full bg-navy-900 border border-navy-700 rounded p-3 text-white focus:border-cyan-400 outline-none" 
                       value={currentShift.name || ''} onChange={e => setCurrentShift({...currentShift, name: e.target.value})} placeholder="Ex: Carlos Silva" />
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 font-bold uppercase">Função</label>
                    <select className="w-full bg-navy-900 border border-navy-700 rounded p-3 text-white focus:border-cyan-400 outline-none"
                       value={currentShift.role} onChange={e => setCurrentShift({...currentShift, role: e.target.value as any})}>
                       <option value="Bartender">Bartender</option>
                       <option value="Barback">Barback</option>
                       <option value="Chefe de Bar">Chefe de Bar</option>
                       <option value="Garçon">Garçon</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase">Início</label>
                        <input type="time" className="w-full bg-navy-900 border border-navy-700 rounded p-3 text-white focus:border-cyan-400 outline-none" 
                           value={currentShift.startTime} onChange={e => setCurrentShift({...currentShift, startTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase">Fim</label>
                        <input type="time" className="w-full bg-navy-900 border border-navy-700 rounded p-3 text-white focus:border-cyan-400 outline-none" 
                           value={currentShift.endTime} onChange={e => setCurrentShift({...currentShift, endTime: e.target.value})} />
                    </div>
                 </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                 <button onClick={() => setShowStaffModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">Cancelar</button>
                 <button onClick={handleSaveShift} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-lg transition">Salvar</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};