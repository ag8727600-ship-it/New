import { InventoryItem, Recipe, EventPlan, Unit, EventType } from '../types';

// Keys for LocalStorage
const INVENTORY_KEY = 'barmaster_inventory';
const RECIPES_KEY = 'barmaster_recipes';
const EVENTS_KEY = 'barmaster_events';

// Initial Seed Data
const seedInventory: InventoryItem[] = [
  { id: '1', name: 'Vodka Premium', category: 'Destilado', quantity: 12, minStock: 5, unit: Unit.UNIT, updatedAt: new Date().toISOString() },
  { id: '2', name: 'Gin London Dry', category: 'Destilado', quantity: 8, minStock: 3, unit: Unit.UNIT, updatedAt: new Date().toISOString() },
  { id: '3', name: 'Xarope de Açúcar', category: 'Xarope', quantity: 5, minStock: 2, unit: Unit.L, updatedAt: new Date().toISOString() },
  { id: '4', name: 'Limão Taiti', category: 'Insumo', quantity: 50, minStock: 20, unit: Unit.UNIT, updatedAt: new Date().toISOString() },
  { id: '5', name: 'Taça Gin', category: 'Vidraria', quantity: 100, minStock: 100, unit: Unit.UNIT, updatedAt: new Date().toISOString() },
  { id: '6', name: 'Copo Long Drink', category: 'Vidraria', quantity: 150, minStock: 50, unit: Unit.UNIT, updatedAt: new Date().toISOString() },
];

const seedRecipes: Recipe[] = [
  { 
    id: '1', 
    name: 'Moscow Mule', 
    category: 'Classico', 
    glassware: 'Caneca Cobre', 
    instructions: '1. Gelo na caneca.\n2. Adicionar Vodka e Limão.\n3. Completar com Espuma de Gengibre.', 
    ingredients: [
      { name: 'Vodka', amount: 50, unit: Unit.ML },
      { name: 'Suco de Limão', amount: 20, unit: Unit.ML },
      { name: 'Xarope de Gengibre', amount: 30, unit: Unit.ML }
    ] 
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const StorageService = {
  // Inventory Methods
  getInventory: async (): Promise<InventoryItem[]> => {
    await delay(200);
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : seedInventory;
  },
  
  saveInventoryItem: async (item: InventoryItem): Promise<void> => {
    const items = await StorageService.getInventory();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    const items = await StorageService.getInventory();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(filtered));
  },

  // Recipe Methods
  getRecipes: async (): Promise<Recipe[]> => {
    await delay(200);
    const data = localStorage.getItem(RECIPES_KEY);
    return data ? JSON.parse(data) : seedRecipes;
  },

  saveRecipe: async (recipe: Recipe): Promise<void> => {
    const items = await StorageService.getRecipes();
    const index = items.findIndex(i => i.id === recipe.id);
    if (index >= 0) {
      items[index] = recipe;
    } else {
      items.push(recipe);
    }
    localStorage.setItem(RECIPES_KEY, JSON.stringify(items));
  },

  deleteRecipe: async (id: string): Promise<void> => {
    const items = await StorageService.getRecipes();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
  },

  // Event/Checklist Methods
  getEvents: async (): Promise<EventPlan[]> => {
    await delay(300);
    const data = localStorage.getItem(EVENTS_KEY);
    // Migration: ensure new fields exist if loading old data
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map((e: any) => ({
      ...e,
      staff: e.staff || [],
      drinkMenu: e.drinkMenu || [],
      time: e.time || '19:00',
      bartenderCount: e.bartenderCount || 0
    }));
  },

  getEventById: async (id: string): Promise<EventPlan | undefined> => {
    const events = await StorageService.getEvents();
    return events.find(e => e.id === id);
  },

  saveEvent: async (event: EventPlan): Promise<void> => {
    const events = await StorageService.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  },

  deleteEvent: async (id: string): Promise<void> => {
    const events = await StorageService.getEvents();
    const filtered = events.filter(e => e.id !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(filtered));
  }
};