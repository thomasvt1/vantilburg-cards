export interface EntityState {
  state: string;
  attributes: Record<string, unknown>;
}
export interface HomeAssistant {
  states: Record<string, EntityState | undefined>;
  themes?: { darkMode?: boolean };
  locale?: { language?: string; number_format?: string };
  language?: string;
  config?: { unit_system?: { temperature?: string } };
}
export type Palette = 'blue' | 'peach' | 'purple' | 'teal' | 'pink' | 'indigo' | 'slate' | 'green' | 'mint' | 'neutral';
export type TapAction = { action: 'none' } | { action: 'navigate'; navigation_path: string } | { action: 'more-info'; entity?: string };
export interface Appearance {
  background?: string; background_dark?: string;
  accent?: string; accent_dark?: string;
  icon_background?: string; icon_background_dark?: string;
  border_radius?: number;
}
export interface CommonConfig {
  type: string;
  name?: string;
  icon?: string;
  palette?: Palette;
  language?: 'auto' | 'en' | 'nl';
  tap_action?: TapAction;
  appearance?: Appearance;
  popup?: PopupConfig;
  [key: string]: unknown;
}
export interface PopupSection { title?: string; icon?: string; columns?: 1 | 2; cards: Record<string, unknown>[] }
export interface PopupConfig { hash: string; title?: string; icon?: string; sections: PopupSection[] }
export interface CardElement extends HTMLElement { hass: HomeAssistant; preview?: boolean; editMode?: boolean; setConfig(config: Record<string, unknown>): void }
export interface CardHelpers { createCardElement(config: Record<string, unknown>): CardElement }
export interface RoomConfig extends CommonConfig {
  type: 'custom:home-room-card';
  entity?: string;
  attribute?: string;
  lights?: string[];
  display?: 'auto' | 'temperature' | 'lights';
  precision?: number;
}
export interface MeterConfig { entity: string; name: string; palette?: Palette; max?: number; negative_palette?: Palette }
export interface HouseConfig extends CommonConfig { type: 'custom:home-house-card'; meters: MeterConfig[] }
export interface WasteConfig extends CommonConfig {
  type: 'custom:home-waste-card'; entity: string; type_entity?: string; moved_entity?: string;
  type_names?: Record<string, string>;
}
export interface EnergyDevice { entity: string; name?: string }
export interface EnergyConfig extends CommonConfig {
  type: 'custom:home-energy-card';
  devices: EnergyDevice[];
  home_entity?: string;
  remainder?: boolean;
  idle_threshold?: number;
}
export interface PowerConfig extends CommonConfig {
  type: 'custom:home-power-card'; entity: string; secondary_entity?: string; precision?: number;
}
export type CardConfig = RoomConfig | HouseConfig | WasteConfig | EnergyConfig | PowerConfig;
