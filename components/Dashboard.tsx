import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { EventPlan, InventoryItem } from '../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [e, i] = await Promise.all([
        StorageService.getEvents(),
        StorageService.getInventory()
      ]);
      setEvents(e);
      setInventory(i);
      setLoading(false);
    };
    loadData();
  }, []);

  // --- Logic for Weekly Schedule (Fixed Synchronization) ---
  
  // 1. Get accurate "Today" at 00:00:00 Local Time
  const getTodayZeroed = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getTodayZeroed();

  // 2. Generate next 7 days based on Local Time
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  // 3. Robust Date Matching Function (Avoids UTC/Timezone issues)
  const isSameDay = (eventDateString: string, columnDate: Date) => {
    if (!eventDateString) return false;
    // Split "YYYY-MM-DD" manually to ensure we treat it as local date parts
    // This avoids new Date('2023-10-25') becoming 2023-10-24 21:00 in GMT-3
    const parts = eventDateString.split('-'); // [YYYY, MM, DD]
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
    const day = parseInt(parts[2], 10);

    return (
      columnDate.getFullYear() === year &&
      columnDate.getMonth() === month &&
      columnDate.getDate() === day
    );
  };

  // 4. Filter events that fall roughly within the range (for optimization)
  const weekEvents = events.filter(e => {
    if (!e.date) return false;
    // Check if the event matches any of our 7 days
    return next7Days.some(day => isSameDay(e.date, day));
  });

  // --- Logic for Stock Flow (Input/Output) ---
  const generateLogisticsReport = () => {
    const report: Record<string, { needed: number, stock: number, unit: string }> = {};

    weekEvents.forEach(evt => {
      evt.checklist.forEach(item => {
        const key = item.name.trim();
        if (!report[key]) {
          const invItem = inventory.find(i => i.name.toLowerCase() === key.toLowerCase());
          report[key] = { 
            needed: 0, 
            stock: invItem ? invItem.quantity : 0,
            unit: invItem ? invItem.unit : 'un'
          };
        }
        report[key].needed += item.quantityNeeded;
      });
    });

    return Object.entries(report)
      .filter(([_, data]) => data.needed > 0)
      .sort((a, b) => b[1].needed - a[1].needed)
      .slice(0, 5);
  };

  const logisticsData = generateLogisticsReport();

  // --- Logic for Distillates Chart (Globo/Pie) ---
  const generateDistillateChartData = () => {
    const distillates = inventory.filter(i => i.category === 'Destilado');
    const totalQuantity = distillates.reduce((acc, curr) => acc + curr.quantity, 0);
    
    const sorted = distillates.sort((a, b) => b.quantity - a.quantity);
    
    // Navy Blue / Ocean Theme Colors
    const colors = [
      '#64ffda', // Cyan
      '#3b82f6', // Blue 500
      '#1d4ed8', // Blue 700
      '#818cf8', // Indigo
      '#c084fc', // Purple
      '#94a3b8'  // Slate
    ]; 
    
    let cumulativePercent = 0;
    const chartData = sorted.map((item, index) => {
      const percent = totalQuantity > 0 ? (item.quantity / totalQuantity) * 100 : 0;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return {
        ...item,
        percent,
        start,
        end: cumulativePercent,
        color: colors[index % colors.length]
      };
    });

    const gradientString = chartData.map(d => `${d.color} ${d.start}% ${d.end}%`).join(', ');

    return { totalQuantity, chartData, gradientString };
  };

  const { totalQuantity, chartData, gradientString } = generateDistillateChartData();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto min-h-screen text-slate-300 pb-12">
      
      {/* 1. Header */}
      <div className="bg-gradient-to-b from-navy-900 to-navy-950 p-6 md:p-8 border-b border-navy-800">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Página Inicial</h1>
        <p className="text-slate-400">Painel de controle <span className="text-cyan-400 font-bold">GESTÃO SHOW</span></p>
      </div>

      <div className="p-4 sm:p-8 space-y-8">

        {/* 2. Horizontal Directional Guides (Quick Access) */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <button onClick={() => navigate('/planner')} 
                 className="flex items-center justify-center space-x-3 bg-navy-800 hover:bg-navy-700 p-4 rounded-xl border border-navy-700 hover:border-cyan-400/50 transition shadow-lg group">
                 <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                   <i className="fas fa-clipboard-list"></i>
                 </div>
                 <span className="font-bold text-white group-hover:text-blue-300">Planejamento</span>
             </button>

             <button onClick={() => navigate('/inventory')} 
                 className="flex items-center justify-center space-x-3 bg-navy-800 hover:bg-navy-700 p-4 rounded-xl border border-navy-700 hover:border-cyan-400/50 transition shadow-lg group">
                 <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center text-green-400 group-hover:bg-green-600 group-hover:text-white transition">
                   <i className="fas fa-wine-bottle"></i>
                 </div>
                 <span className="font-bold text-white group-hover:text-green-300">Inventário</span>
             </button>

             <button onClick={() => navigate('/checklists')} 
                 className="flex items-center justify-center space-x-3 bg-navy-800 hover:bg-navy-700 p-4 rounded-xl border border-navy-700 hover:border-cyan-400/50 transition shadow-lg group">
                 <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                   <i className="fas fa-glass-cheers"></i>
                 </div>
                 <span className="font-bold text-white group-hover:text-purple-300">Eventos</span>
             </button>

             <button onClick={() => navigate('/recipes')} 
                 className="flex items-center justify-center space-x-3 bg-navy-800 hover:bg-navy-700 p-4 rounded-xl border border-navy-700 hover:border-cyan-400/50 transition shadow-lg group">
                 <div className="w-8 h-8 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition">
                   <i className="fas fa-book"></i>
                 </div>
                 <span className="font-bold text-white group-hover:text-amber-300">Receitas</span>
             </button>
          </div>
        </section>

        {/* 3. Weekly Schedule (Cronograma) - Now at Top */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-white flex items-center">
                <i className="far fa-calendar-alt text-cyan-400 mr-2"></i> Cronograma Semanal
             </h2>
             <span className="text-xs font-bold bg-navy-800 border border-navy-600 px-3 py-1 rounded-full text-cyan-400">{weekEvents.length} eventos / 7 dias</span>
          </div>
          
          <div className="bg-navy-800 rounded-2xl border border-navy-700 p-6 overflow-x-auto shadow-xl">
            <div className="flex min-w-[800px] justify-between space-x-3">
              {next7Days.map((date, index) => {
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                // Use strict logic to match events to this column's date
                const daysEvents = events.filter(e => e.date && isSameDay(e.date, date));
                const isToday = index === 0;

                return (
                  <div key={index} className={`flex-1 min-w-[140px] flex flex-col rounded-xl border transition-all duration-300 ${isToday ? 'bg-navy-700/80 border-cyan-500 shadow-lg shadow-cyan-900/20' : 'bg-navy-900/50 border-navy-700 hover:bg-navy-700'}`}>
                    {/* Header do Dia */}
                    <div className={`p-3 text-center border-b ${isToday ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-navy-700 bg-navy-900/50'} rounded-t-xl`}>
                        <span className={`text-[10px] font-bold tracking-widest block mb-1 ${isToday ? 'text-cyan-400' : 'text-slate-500'}`}>{dayName}</span>
                        <span className={`text-2xl font-serif font-black ${isToday ? 'text-white' : 'text-slate-400'}`}>{date.getDate()}</span>
                    </div>
                    
                    {/* Lista de Eventos */}
                    <div className="p-2 space-y-2 flex-1 min-h-[120px] bg-opacity-50">
                      {daysEvents.length > 0 ? daysEvents.map(evt => (
                        <div 
                           key={evt.id} 
                           onClick={() => navigate(`/checklists/${evt.id}`)}
                           className="group bg-navy-600/30 hover:bg-navy-600/80 border border-navy-500/30 hover:border-cyan-400 p-3 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-cyan-900/20 relative overflow-hidden"
                           title="Ver detalhes"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                          <div className="pl-2">
                             <div className="font-bold text-white text-xs leading-tight mb-1.5">{evt.name}</div>
                             <div className="flex justify-between items-end">
                                <span className="text-[9px] text-cyan-100 bg-cyan-900/40 px-1.5 py-0.5 rounded border border-cyan-800/50">{evt.eventType}</span>
                                <i className="fas fa-chevron-right text-[10px] text-slate-500 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition"></i>
                             </div>
                             {evt.time && (
                               <div className="mt-1 text-[9px] text-amber-500 font-mono"><i className="far fa-clock mr-1"></i>{evt.time}</div>
                             )}
                          </div>
                        </div>
                      )) : (
                        <div className="h-full flex flex-col items-center justify-center text-navy-600">
                           <i className="fas fa-glass-martini text-2xl mb-2 opacity-30"></i>
                           <span className="text-[10px] opacity-50">Livre</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Inventory Insights (Distillate Chart) */}
        <section className="bg-navy-800 rounded-2xl border border-navy-700 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
             {/* Background Decoration */}
             <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl"></div>

             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                   <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                     <span className="w-1.5 h-8 bg-cyan-400 rounded-full mr-3"></span>
                     Distribuição de Destilados
                   </h2>
                   <p className="text-slate-400 mb-6 max-w-md text-sm leading-relaxed">
                     Panorama visual do estoque de bebidas premium.
                   </p>
                   
                   {/* Legend */}
                   <div className="grid grid-cols-2 gap-3">
                       {chartData.map(d => (
                         <div key={d.id} className="flex items-center text-sm p-2 bg-navy-900/60 backdrop-blur rounded-lg border border-navy-700/50 hover:border-cyan-400/30 transition">
                           <span className="w-3 h-3 rounded-full mr-3 shadow-[0_0_8px_rgba(100,255,218,0.5)]" style={{backgroundColor: d.color}}></span>
                           <div className="flex flex-col">
                             <span className="text-slate-200 font-medium">{d.name}</span>
                             <span className="text-slate-500 text-xs">{d.quantity} garrafas <span className="text-cyan-400/70">({Math.round(d.percent)}%)</span></span>
                           </div>
                         </div>
                       ))}
                       {chartData.length === 0 && <span className="text-slate-500 italic">Sem dados de destilados.</span>}
                   </div>
                </div>

                <div className="flex justify-center md:justify-end pr-0 md:pr-12">
                  {chartData.length > 0 ? (
                    <div 
                      className="w-64 h-64 rounded-full relative shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-8 ring-navy-900/50"
                      style={{ background: `conic-gradient(${gradientString})` }}
                    >
                      <div className="absolute inset-0 m-auto w-44 h-44 bg-navy-800 rounded-full flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border border-navy-700">
                         <span className="text-5xl font-bold text-white drop-shadow-lg">{totalQuantity}</span>
                         <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold mt-1">Garrafas</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-full bg-navy-900 flex items-center justify-center text-slate-600 border border-navy-700 border-dashed">
                       Vazio
                    </div>
                  )}
                </div>
             </div>
        </section>

        {/* 5. Analytics Section - Logistics */}
        <section>
          <div className="bg-navy-800 rounded-2xl border border-navy-700 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
               <i className="fas fa-truck-loading mr-2 text-cyan-400"></i>
               Controle de Logística
            </h2>
            <div className="overflow-hidden rounded-xl border border-navy-600/50">
              <table className="w-full text-left">
                <thead className="bg-navy-900 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-4">Item / Produto</th>
                    <th className="px-5 py-4 text-center text-red-400">Saída Prevista</th>
                    <th className="px-5 py-4 text-center text-green-400">Estoque</th>
                    <th className="px-5 py-4 text-right">Balanço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700 text-sm">
                  {logisticsData.length > 0 ? logisticsData.map(([name, data]) => {
                    const balance = data.stock - data.needed;
                    const isDeficit = balance < 0;
                    return (
                      <tr key={name} className="hover:bg-navy-700/50 transition">
                        <td className="px-5 py-4 font-medium text-white">{name}</td>
                        <td className="px-5 py-4 text-center font-bold text-red-400 bg-red-900/5">
                           -{data.needed} <span className="text-[10px] text-slate-500 font-normal">{data.unit}</span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-green-400 bg-green-900/5">
                           {data.stock} <span className="text-[10px] text-slate-500 font-normal">{data.unit}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isDeficit ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
                            {isDeficit ? 'Déficit' : 'OK'} ({balance > 0 ? '+' : ''}{balance})
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Tudo tranquilo! Nenhum consumo previsto.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};