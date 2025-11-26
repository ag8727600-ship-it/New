import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { InventoryManager } from './components/InventoryManager';
import { RecipeBook } from './components/RecipeBook';
import { EventPlanner } from './components/EventPlanner';
import { ChecklistRepository } from './components/ChecklistRepository';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-navy-950 flex flex-col font-sans text-slate-300">
        <Navigation />
        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryManager />} />
            <Route path="/recipes" element={<RecipeBook />} />
            <Route path="/planner" element={<EventPlanner />} />
            <Route path="/checklists" element={<ChecklistRepository />} />
            <Route path="/checklists/:id" element={<ChecklistRepository />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;