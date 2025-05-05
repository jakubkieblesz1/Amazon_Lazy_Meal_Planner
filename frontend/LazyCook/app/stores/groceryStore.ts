import { create } from 'zustand';

interface GroceryItem {
  category: string;
  name: string;
  quantity: string;
}

interface GroceryStore {
  hasGeneratedMeals: boolean;
  groceryList: GroceryItem[];
  setGroceryList: (list: GroceryItem[]) => void;
  setHasGeneratedMeals: (value: boolean) => void;
}

export const useGroceryStore = create<GroceryStore>((set) => ({
  hasGeneratedMeals: false,
  groceryList: [],
  setGroceryList: (list) => set({ groceryList: list }),
  setHasGeneratedMeals: (value) => set({ hasGeneratedMeals: value }),
})); 