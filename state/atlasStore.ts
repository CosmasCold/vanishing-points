import { create } from 'zustand';
import { Place, PlaceCategory, PlaceStatus } from '@/types/places';

interface Viewport {
  lng: number;
  lat: number;
  zoom: number;
}

interface AtlasState {
  places: Place[];
  isLoading: boolean;
  viewport: Viewport;
  selectedPlaceId: string | null;
  filterCategory: PlaceCategory | null;
  filterStatus: PlaceStatus | null;
  
  setPlaces: (places: Place[]) => void;
  setLoading: (loading: boolean) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  selectPlace: (slug: string | null) => void;
  setFilterCategory: (category: PlaceCategory | null) => void;
  setFilterStatus: (status: PlaceStatus | null) => void;
  clearFilters: () => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  places: [],
  isLoading: false,
  viewport: { lng: 20, lat: 30, zoom: 1.5 },
  selectedPlaceId: null,
  filterCategory: null,
  filterStatus: null,
  
  setPlaces: (places) => set({ places }),
  setLoading: (loading) => set({ isLoading: loading }),
  setViewport: (v) => set((s) => ({ viewport: { ...s.viewport, ...v } })),
  selectPlace: (slug) => set({ selectedPlaceId: slug }),
  setFilterCategory: (c) => set({ filterCategory: c }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  clearFilters: () => set({ filterCategory: null, filterStatus: null }),
}));