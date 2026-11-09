import { palettes } from './appearance';
import type { CardConfig } from './types';
const entityId = /^[a-z_]+\.[a-z0-9_]+$/;
function entity(value: unknown, field: string) {
  if (typeof value !== 'string' || !entityId.test(value)) throw new Error(`${field} must be an entity ID.`);
}
export function validateConfig(config: CardConfig) {
  if (!config || !['custom:home-room-card', 'custom:home-house-card', 'custom:home-waste-card'].includes(config.type)) throw new Error('Select a vanTilburg card type.');
  for (const key of ['name', 'icon'] as const) if (config[key] !== undefined && typeof config[key] !== 'string') throw new Error(`${key} must be text.`);
  if (config.palette !== undefined && !Object.hasOwn(palettes, config.palette)) throw new Error('Choose a supported palette.');
  if (config.language !== undefined && !['auto', 'en', 'nl'].includes(config.language)) throw new Error('language must be auto, en or nl.');
  const action = config.tap_action;
  if (action !== undefined) {
    if (!action || !['none', 'navigate', 'more-info'].includes(action.action)) throw new Error('tap_action must be none, navigate or more-info.');
    if (action.action === 'navigate' && (typeof action.navigation_path !== 'string' || !/^(#|\/(?!\/))/.test(action.navigation_path))) throw new Error('navigation_path must be a local path or #popup hash.');
    if (action.action === 'more-info' && action.entity !== undefined) entity(action.entity, 'tap_action.entity');
  }
  if (config.appearance !== undefined) {
    if (!config.appearance || typeof config.appearance !== 'object' || Array.isArray(config.appearance)) throw new Error('appearance must be an object.');
    for (const [key, value] of Object.entries(config.appearance)) {
      if (key === 'border_radius') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 48) throw new Error('border_radius must be between 0 and 48.');
      } else if (!['background', 'background_dark', 'accent', 'accent_dark', 'icon_background', 'icon_background_dark'].includes(key) || typeof value !== 'string' || !value.trim()) throw new Error(`Invalid appearance option: ${key}`);
    }
  }
  if (config.popup !== undefined) {
    const popup = config.popup;
    if (!popup || typeof popup !== 'object' || typeof popup.hash !== 'string' || !/^#[a-zA-Z0-9_-]+$/.test(popup.hash)) throw new Error('popup.hash must be a unique #name.');
    if (!Array.isArray(popup.sections)) throw new Error('popup.sections must be a list.');
    for (const section of popup.sections) {
      if (!section || typeof section !== 'object' || !Array.isArray(section.cards)) throw new Error('Each popup section needs a cards list.');
      if (section.columns !== undefined && ![1, 2].includes(section.columns)) throw new Error('Section columns must be 1 or 2.');
      for (const key of ['title', 'icon'] as const) if (section[key] !== undefined && typeof section[key] !== 'string') throw new Error(`Section ${key} must be text.`);
      for (const card of section.cards) {
        if (!card || typeof card !== 'object' || typeof card.type !== 'string') throw new Error('Each section card needs a type.');
        if (card.popup) throw new Error('Nested popups are not supported.');
      }
    }
    if (config.tap_action && config.tap_action.action !== 'none') throw new Error('Use popup or tap_action, not both. The popup handles navigation.');
  }
  if (config.type === 'custom:home-room-card') {
    if (config.entity !== undefined) entity(config.entity, 'entity');
    if (config.attribute !== undefined && (typeof config.attribute !== 'string' || !config.attribute.trim())) throw new Error('attribute must be nonempty text.');
    if (config.display !== undefined && !['auto', 'temperature', 'lights'].includes(config.display)) throw new Error('display must be auto, temperature or lights.');
    if (config.precision !== undefined && (!Number.isInteger(config.precision) || config.precision < 0 || config.precision > 3)) throw new Error('precision must be an integer from 0 to 3.');
    if (config.lights !== undefined) {
      if (!Array.isArray(config.lights)) throw new Error('lights must be a list of light entities.');
      for (const id of config.lights) { entity(id, 'lights'); if (!id.startsWith('light.')) throw new Error('lights must contain light entities.'); }
    }
    if (config.display === 'lights' || (config.display !== 'temperature' && !config.entity)) {
      if (!config.lights?.length) throw new Error('Select at least one light.');
    } else if (!config.entity) throw new Error('Select a temperature entity.');
  }
  if (config.type === 'custom:home-house-card') {
    if (!Array.isArray(config.meters) || !config.meters.length || config.meters.length > 6) throw new Error('meters must contain 1 to 6 percentage sensors.');
    for (const meter of config.meters) {
      if (!meter || typeof meter !== 'object') throw new Error('Each meter must be an object.');
      entity(meter.entity, 'meters.entity');
      if (typeof meter.name !== 'string' || !meter.name.trim()) throw new Error('Each meter needs a name.');
      if (meter.palette !== undefined && !Object.hasOwn(palettes, meter.palette)) throw new Error('Choose a supported meter palette.');
    }
    if (action?.action === 'more-info' && !action.entity) throw new Error('Select a tap_action.entity for more-info.');
  }
  if (config.type === 'custom:home-waste-card') {
    entity(config.entity, 'entity');
    if (config.type_entity !== undefined) entity(config.type_entity, 'type_entity');
    if (config.moved_entity !== undefined) entity(config.moved_entity, 'moved_entity');
    if (config.type_names !== undefined && (!config.type_names || typeof config.type_names !== 'object' || Array.isArray(config.type_names) || Object.values(config.type_names).some(v => typeof v !== 'string'))) throw new Error('type_names must map waste types to labels.');
  }
}
