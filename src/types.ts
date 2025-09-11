export type LifeState = {
  hp: number;
  hpMax: number;
  adrenaline: number;
  prayer: number;
  prayerMax: number;
  summoning: number;
  summoningMax: number;
  exacthp: { cur: number; max: number } | null;
  exactprayer: { cur: number; max: number } | null;
  exactsummoning: { cur: number; max: number } | null;
  exactadrenaline: { cur: number; max: number } | null;
  /** Whether the adrenaline icon (lit variant) was detected this tick */
  adrenalineActive?: boolean;
  /** Whether the prayer icon (lit variant) was detected this tick */
  prayerActive?: boolean;
};

export type Layout = {
  hp: PointLike;
  adrenaline: PointLike;
  prayer: PointLike;
  summoning: PointLike;
  width: number;
  height: number;
  hor: boolean;
  barlength: number;
  type: MainBarType;
};

export type MainBarType = "mainflat" | "mainhor" | "mainver" | "maintower";

export type PointLike = {
  x: number;
  y: number;
};

export interface OverlayCustomization {
  showHP: boolean;
  showAdrenaline: boolean;
  showPrayer: boolean;
  showSummoning: boolean;
  showText: boolean;
  showIcons: boolean;
  barHeight: number;
  barWidth: number;
  colors: {
    hp: string;
    hpLow: string;
    adrenaline: string;
    prayer: string;
    summoning: string;
    background: string;
    border: string;
    text: string;
  };
  opacity: number;
  fontSize: number;
  lowHpThreshold: number;
  position: { x: number; y: number };
  layout: 'horizontal' | 'vertical' | 'compact' | 'minimal';
  alwaysOnTop: boolean;
  hideWhenFull: boolean;
  /**
   * Name of the selected theme. "classic" preserves current styling. "custom" lets the user edit the color pickers below.
   */
  theme?: string;
  /**
   * Layout directives supplied by a theme (gap/order/icon sizing). Users editing raw customization may override.
   */
  themeLayout?: {
    gap?: number;
    iconAreaWidth?: number; // default 20
    adrenalineFullWidth?: boolean; // horizontal layout adrenaline bar spans full row
    order?: ("hp" | "prayer" | "summoning" | "adrenaline")[]; // drawing order
  };
  /** Optional gradient configuration for bar fill colors */
  gradient?: {
    orientation: 'horizontal' | 'vertical';
    hp?: { from: string; to: string };
    adrenaline?: { from: string; to: string };
    prayer?: { from: string; to: string };
    summoning?: { from: string; to: string };
  };
  keybinds?: {
    toggleOverlay?: string;
    toggleSettings?: string;
    resetPosition?: string;
  };
  /** Position of the numeric text relative to the bar */
  textPosition?: 'inside' | 'above';
  /** Horizontal alignment of the bar text */
  textAlign?: 'left' | 'center' | 'right';
  /** Format string when current > max (placeholders: {current}, {max}, {diff}) */
  overcapTextFormat?: string;
  /** Text color used when current > max */
  overcapTextColor?: string;
  /** Enables built-in Alt1 text shadow (last parameter to overLayTextEx). Default true. */
  textShadow?: boolean;
}
