import { OverlayCustomization } from '../types';

// Theme definition interface (partial customization focusing on colors + a few stylistic props)
export interface OverlayThemeDefinition {
  name: string;               // unique id
  label: string;              // user-friendly label
  description?: string;       // optional short description
  colors: OverlayCustomization['colors'];
  opacity?: number;
  fontSize?: number;
  barHeight?: number;
  barWidth?: number; // recommended default width
  layout?: OverlayCustomization['themeLayout'];
}

// Built-in themes. "classic" replicates current look (serves as baseline).
export const BUILT_IN_THEMES: OverlayThemeDefinition[] = [
  {
    name: 'classic',
    label: 'Classic',
    description: 'Original Better Combat Bars styling',
    colors: {
      hp: '#ff4757',
      hpLow: '#ff3838',
      adrenaline: '#ffa502',
      prayer: '#5352ed',
      summoning: '#2ed573',
      background: 'rgba(0, 0, 0, 0.3)',
      border: 'rgba(255, 255, 255, 0.5)',
      text: '#ffffff',
    },
    opacity: 0.9,
    fontSize: 12,
    barHeight: 20,
    layout: { gap: 8, iconAreaWidth: 20, adrenalineFullWidth: true, order: ['hp','prayer','summoning','adrenaline'] },
  },
  {
    name: 'rs-dark',
    label: 'RuneScape Dark',
    description: 'Dark muted UI w/ saturated resource colors',
    colors: {
      hp: '#d83448',
      hpLow: '#ff1e24',
      adrenaline: '#e0b341',
      prayer: '#3d7be0',
      summoning: '#3fbf6b',
      background: 'rgba(20, 20, 25, 0.55)',
      border: 'rgba(180, 180, 200, 0.35)',
      text: '#f2f2f2',
    },
    opacity: 0.85,
    barHeight: 18,
    fontSize: 11,
    layout: { gap: 6, iconAreaWidth: 18, adrenalineFullWidth: true, order: ['hp','prayer','summoning','adrenaline'] },
  },
  {
    name: 'neo',
    label: 'Neo (High Contrast)',
    description: 'High contrast vibrant theme',
    colors: {
      hp: '#ff2d55',
      hpLow: '#ff0033',
      adrenaline: '#ffd60a',
      prayer: '#0a84ff',
      summoning: '#30d158',
      background: 'rgba(0, 0, 0, 0.5)',
      border: 'rgba(255, 255, 255, 0.6)',
      text: '#ffffff',
    },
    opacity: 0.95,
    barHeight: 22,
    fontSize: 13,
    layout: { gap: 8, iconAreaWidth: 22, adrenalineFullWidth: true, order: ['hp','prayer','summoning','adrenaline'] },
  },
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'Subtle transparent background, thin border',
    colors: {
      hp: '#e74c3c',
      hpLow: '#ff1e1e',
      adrenaline: '#f1c40f',
      prayer: '#3498db',
      summoning: '#2ecc71',
      background: 'rgba(0,0,0,0.15)',
      border: 'rgba(255,255,255,0.25)',
      text: '#ffffff',
    },
    opacity: 0.8,
    barHeight: 16,
    fontSize: 11,
    layout: { gap: 4, iconAreaWidth: 16, adrenalineFullWidth: true, order: ['hp','prayer','summoning','adrenaline'] },
  },
];

export function getThemeByName(name: string | undefined): OverlayThemeDefinition | undefined {
  if (!name) return undefined;
  return BUILT_IN_THEMES.find(t => t.name === name);
}

// Apply a theme onto an existing customization while preserving layout/visibility toggles and user overrides when appropriate.
export function applyTheme(base: OverlayCustomization, theme: OverlayThemeDefinition): OverlayCustomization {
  return {
    ...base,
    theme: theme.name,
    colors: { ...theme.colors },
    opacity: theme.opacity ?? base.opacity,
    fontSize: theme.fontSize ?? base.fontSize,
    barHeight: theme.barHeight ?? base.barHeight,
    barWidth: theme.barWidth ?? base.barWidth,
    themeLayout: theme.layout ? { ...theme.layout } : base.themeLayout,
  };
}
