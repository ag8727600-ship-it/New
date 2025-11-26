export enum Unit {
  ML = 'ml',
  L = 'l',
  OZ = 'oz',
  UNIT = 'un',
  KG = 'kg',
  G = 'g'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // e.g., 'Destilado', 'Xarope', 'Copo', 'Insumo'
  quantity: number;
  minStock: number;
  unit: Unit;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  glassware: string;
  category: string;
}

export enum EventType {
  WEDDING = 'Casamento',
  BIRTHDAY = 'Aniversário',
  CORPORATE = 'Corporativo',
  OTHER = 'Outro'
}

export interface ChecklistItem {
  name: string;
  category: 'Bebida' | 'Insumo' | 'Xarope' | 'Vidraria' | 'Utensilio' | 'Estrutura' | 'Animacao';
  quantityNeeded: number;
  quantityPacked: number;
  notes: string;
  isPacked: boolean;
}

export interface StaffShift {
  id: string;
  name: string;
  role: 'Bartender' | 'Barback' | 'Chefe de Bar' | 'Garçon';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hourlyRate?: number;
}

export interface EventPlan {
  id: string;
  name: string;
  clientName: string;
  date: string;
  time?: string; // Added field
  location: string;
  eventType: EventType;
  guestCount: number;
  bartenderCount?: number; // Added field explicit
  
  drinkMenu?: string[]; // Added field

  status: 'Draft' | 'Confirmed' | 'Completed';
  
  // Detailed Checklist Data
  checklist: ChecklistItem[];
  
  // Staffing / Escala
  staff: StaffShift[];

  createdAt: string;
  updatedAt: string;
}

// For Mock Auth
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}