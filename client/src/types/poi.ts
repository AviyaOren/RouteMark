export interface PoiWithLocation {
  id: string;
  type: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  created_at?: string;
  updated_at?: string;
}

export type { Poi, InsertPoi } from "@shared/schema";
