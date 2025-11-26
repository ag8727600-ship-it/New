import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavTab = ({ to, icon, label, active }: { to: string, icon: string, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
      active 
        ? 'border-cyan-400 text-cyan-400 bg-navy-800/50' 
        : 'border-transparent text-slate-400 hover:text-cyan-200 hover:bg-navy-800/30'
    }`}
  >
    <i className={`fas ${icon} ${active ? 'animate-pulse' : ''}`}></i>
    <span>{label}</span>
  </Link>
);

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-navy-900/90 border-b border-navy-700 sticky top-0 z-50 backdrop-blur-md shadow-lg shadow-navy-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center pr-8">
               <h1 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider flex items-center">
                <i className="fas fa-cocktail mr-2 text-cyan-400"></i>
                GESTÃO SHOW
              </h1>
            </div>

            {/* Horizontal Tabs */}
            <div className="hidden md:flex space-x-1 overflow-x-auto">
              <NavTab to="/" icon="fa-home" label="Início" active={location.pathname === '/'} />
              <NavTab to="/inventory" icon="fa-boxes-stacked" label="Inventário" active={location.pathname === '/inventory'} />
              <NavTab to="/recipes" icon="fa-book-open" label="Receitas" active={location.pathname === '/recipes'} />
              <NavTab to="/planner" icon="fa-clipboard-list" label="Planejamento" active={location.pathname === '/planner'} />
              <NavTab to="/checklists" icon="fa-folder-open" label="Eventos" active={location.pathname.startsWith('/checklists')} />
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3 text-slate-400 hover:text-cyan-400 cursor-pointer transition group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white group-hover:text-cyan-300">Administrador</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Gerente</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center border border-navy-600 group-hover:border-cyan-400 transition shadow-lg shadow-black/20">
                <i className="fas fa-user text-xs"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Scrollable Nav */}
      <div className="md:hidden overflow-x-auto flex space-x-1 px-2 border-t border-navy-800 bg-navy-900">
          <NavTab to="/" icon="fa-home" label="Início" active={location.pathname === '/'} />
          <NavTab to="/inventory" icon="fa-boxes-stacked" label="Inv." active={location.pathname === '/inventory'} />
          <NavTab to="/recipes" icon="fa-book-open" label="Receitas" active={location.pathname === '/recipes'} />
          <NavTab to="/planner" icon="fa-clipboard-list" label="Plan." active={location.pathname === '/planner'} />
          <NavTab to="/checklists" icon="fa-folder-open" label="Eventos" active={location.pathname.startsWith('/checklists')} />
      </div>
    </nav>
  );
};