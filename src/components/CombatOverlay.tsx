import './CombatOverlay.css';

import { LifeState, OverlayCustomization } from '../types';

import React from 'react';

interface CombatOverlayProps {
  states: LifeState;
  customization: OverlayCustomization;
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({
  states,
  customization,
}) => {
  // Removed fading logic; overlay always uses configured opacity

  // (Fade when inactive removed)

  const getBarColor = (type: 'hp' | 'adrenaline' | 'prayer' | 'summoning', value: number, max?: number): string => {
    if (type === 'hp' && max && (value / max) * 100 < customization.lowHpThreshold) {
      return customization.colors.hpLow;
    }
    return customization.colors[type];
  };

  const shouldHideBar = (value: number, max?: number): boolean => {
    if (!customization.hideWhenFull) return false;
    if (max) return value === max;
    return value === 100; // For adrenaline
  };

  const renderBar = (
    type: 'hp' | 'adrenaline' | 'prayer' | 'summoning',
    current: number,
    max?: number,
    icon?: string
  ) => {
    const percentage = max ? (current / max) * 100 : current;
    const displayValue = max ? `${current}/${max}` : `${current}%`;

    if (shouldHideBar(current, max)) return null;

    const barStyle = {
      width: customization.layout === 'vertical' ? customization.barHeight : customization.barWidth,
      height: customization.layout === 'vertical' ? customization.barWidth : customization.barHeight,
    };

    return (
      <div className={`combat-bar combat-bar-${type}`} style={barStyle}>
        {customization.showIcons && icon && (
          <img src={icon} alt={type} className="combat-icon" />
        )}
        <div
          className="combat-bar-background"
          style={{
            backgroundColor: customization.colors.background,
            border: `1px solid ${customization.colors.border}`,
          }}
        >
          <div
            className="combat-bar-fill"
            style={{
              width: customization.layout === 'vertical' ? '100%' : `${Math.max(0, Math.min(100, percentage))}%`,
              height: customization.layout === 'vertical' ? `${Math.max(0, Math.min(100, percentage))}%` : '100%',
              backgroundColor: getBarColor(type, current, max),
            }}
          />
        </div>
        {customization.showText && (
          <div
            className="combat-bar-text"
            style={{
              color: customization.colors.text,
              fontSize: customization.fontSize,
            }}
          >
            {displayValue}
          </div>
        )}
      </div>
    );
  };

  const overlayStyle = {
    position: 'fixed' as const,
    left: customization.position.x,
    top: customization.position.y,
    opacity: customization.opacity,
    zIndex: customization.alwaysOnTop ? 9999 : 1000,
    transition: 'opacity 0.3s ease',
  };

  const containerClass = `combat-overlay combat-overlay-${customization.layout}`;

  return (
    <div className={containerClass} style={overlayStyle}>
      {customization.showHP && renderBar('hp', states.hp, states.hpMax, '/src/assets/hp.png')}
      {customization.showAdrenaline && renderBar('adrenaline', states.adrenaline, undefined, '/src/assets/adrenaline_off.png')}
      {customization.showPrayer && renderBar('prayer', states.prayer, states.prayerMax, '/src/assets/prayer_off.png')}
      {customization.showSummoning && renderBar('summoning', states.summoning, states.summoningMax, '/src/assets/summoning.png')}
    </div>
  );
};
