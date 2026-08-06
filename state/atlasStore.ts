import { create } from 'zustand';
import { Place } from '@/types/places';

interface AtlasState {
  places: Place[];
  selectedPlaceSlug: string | null;
  isLoading: boolean;
  error: string | null;
  filterCategory: string | null;
  filterStatus: string | null;

  setPlaces: (places: Place[]) => void;
  selectPlace: (slug: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilterCategory: (cat: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  places: [],
  selectedPlaceSlug: null,
  isLoading: false,
  error: null,
  filterCategory: null,
  filterStatus: null,

  setPlaces: (places) => set({ places }),
  selectPlace: (slug) => set({ selectedPlaceSlug: slug }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  clearFilters: () => set({ filterCategory: null, filterStatus: null }),
  clearError: () => set({ error: null }),
}));