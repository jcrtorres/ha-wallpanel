export type Accent = 'auto' | 'none' | 'copper' | 'teal';
export type TileType = 'entity' | 'climate-big' | 'weather' | 'bars' | 'number';

export interface BarEntity { entity: string; label?: string }

export interface Tile {
  id: string;
  type: TileType;
  w: number; // columnas
  h: number; // filas
  entity?: string;
  label?: string;
  icon?: string; // clave de ICONS
  accent?: Accent;
  // climate-big
  humidity?: string;
  extra?: string;
  // number
  action?: string;
  cta?: string;
  unit?: string;
  // bars
  entities?: BarEntity[];
  compareAttr?: string;
  // cámara
  mode?: '' | 'icon';
}

export interface View { id: string; name: string; tiles: Tile[] }
export interface Section { id: string; name: string; views: View[] }
export interface DashboardConfig {
  version: 1;
  updatedAt: number;
  idleReturnSec: number;
  sections: Section[];
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}
