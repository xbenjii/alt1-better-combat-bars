import './CustomizationPanel.css';

import { BUILT_IN_THEMES, applyTheme, getThemeByName } from '../config/themes';
import React, { useEffect, useRef, useState } from 'react';

import { OverlayCustomization } from '../types';

interface CustomizationPanelProps {
  customization: OverlayCustomization;
  onCustomizationChange: (customization: OverlayCustomization) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  customization,
  onCustomizationChange,
  isVisible,
  onToggle,
}) => {
  // Local working copy to allow immediate UI feedback while debouncing expensive overlay updates
  const [localCustomization, setLocalCustomization] = useState<OverlayCustomization>(customization);

  // Keep local state in sync when parent customization changes externally (e.g., loading defaults)
  useEffect(() => {
    setLocalCustomization(customization);
  }, [customization]);

  const debounceTimer = useRef<number | null>(null);
  const DEBOUNCE_MS = 150; // tune as needed

  const scheduleParentUpdate = (next: OverlayCustomization, immediate = false) => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (immediate) {
      onCustomizationChange(next);
    } else {
      debounceTimer.current = window.setTimeout(() => {
        onCustomizationChange(next);
        debounceTimer.current = null;
      }, DEBOUNCE_MS);
    }
  };

  const updateCustomization = (updates: Partial<OverlayCustomization>, opts?: { immediate?: boolean }) => {
    setLocalCustomization(prev => {
      const merged = { ...prev, ...updates } as OverlayCustomization;
      scheduleParentUpdate(merged, !!opts?.immediate);
      return merged;
    });
  };

  const updateColors = (colorKey: string, value: string) => {
    updateCustomization({
      colors: { ...localCustomization.colors, [colorKey]: value },
    });
  };

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    updateCustomization({
      position: { ...localCustomization.position, [axis]: value },
    });
  };

  if (!isVisible) {
    return (
      <button className="customization-toggle" onClick={onToggle}>
        ⚙️ Customize Overlay
      </button>
    );
  }

  return (
    <div className="customization-panel">
      <div className="panel-header">
        <h3>Combat Overlay Settings</h3>
        <button className="close-button" onClick={onToggle}>×</button>
      </div>

      <div className="panel-content">
        {/* Visibility Settings */}
        <div className="settings-section">
          <h4>Visibility</h4>
          <div className="checkbox-grid">
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showHP}
                onChange={(e) => updateCustomization({ showHP: e.target.checked })}
              />
              Show HP
            </label>
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showAdrenaline}
                onChange={(e) => updateCustomization({ showAdrenaline: e.target.checked })}
              />
              Show Adrenaline
            </label>
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showPrayer}
                onChange={(e) => updateCustomization({ showPrayer: e.target.checked })}
              />
              Show Prayer
            </label>
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showSummoning}
                onChange={(e) => updateCustomization({ showSummoning: e.target.checked })}
              />
              Show Summoning
            </label>
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showText}
                onChange={(e) => updateCustomization({ showText: e.target.checked })}
              />
              Show Text
            </label>
            <label>
              <input
                type="checkbox"
                checked={localCustomization.showIcons}
                onChange={(e) => updateCustomization({ showIcons: e.target.checked })}
              />
              Show Icons
            </label>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="settings-section">
          <h4>Layout</h4>
          <label>
            Theme:
            <select
              value={localCustomization.theme || 'classic'}
              onChange={(e) => {
                const newTheme = e.target.value;
                if (newTheme === 'custom') {
                  updateCustomization({ theme: 'custom' });
                } else {
                  const themeDef = getThemeByName(newTheme);
                  if (themeDef) {
                    const themed = applyTheme(localCustomization, themeDef);
                    setLocalCustomization(themed);
                    scheduleParentUpdate(themed, true); // apply theme immediately for clarity
                  }
                }
              }}
            >
              {BUILT_IN_THEMES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>
          <label>
            Layout Style:
            <select
              value={localCustomization.layout}
              onChange={(e) => updateCustomization({ layout: e.target.value as 'horizontal' | 'vertical' | 'compact' | 'minimal' })}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="compact">Compact</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
          <label>
            Bar Width:
            <input
              type="range"
              min="50"
              max="300"
              value={localCustomization.barWidth}
              onChange={(e) => updateCustomization({ barWidth: parseInt(e.target.value) })}
            />
            <span>{localCustomization.barWidth}px</span>
          </label>
          <label>
            Bar Height:
            <input
              type="range"
              min="10"
              max="50"
              value={localCustomization.barHeight}
              onChange={(e) => updateCustomization({ barHeight: parseInt(e.target.value) })}
            />
            <span>{localCustomization.barHeight}px</span>
          </label>
        </div>

        {/* Position Settings */}
        <div className="settings-section">
          <h4>Position</h4>
          <label>
            X Position:
            <input
              type="number"
              value={localCustomization.position.x}
              onChange={(e) => updatePosition('x', parseInt(e.target.value) || 0)}
            />
          </label>
          <label>
            Y Position:
            <input
              type="number"
              value={localCustomization.position.y}
              onChange={(e) => updatePosition('y', parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        {/* Appearance Settings */}
        <div className="settings-section">
          <h4>Appearance</h4>
          <label>
            Opacity:
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={localCustomization.opacity}
              onChange={(e) => updateCustomization({ opacity: parseFloat(e.target.value) })}
            />
            <span>{Math.round(localCustomization.opacity * 100)}%</span>
          </label>
          <label>
            Font Size:
            <input
              type="range"
              min="8"
              max="24"
              value={localCustomization.fontSize}
              onChange={(e) => updateCustomization({ fontSize: parseInt(e.target.value) })}
            />
            <span>{localCustomization.fontSize}px</span>
          </label>
          <label>
            Text Position:
            <select
              value={localCustomization.textPosition || 'inside'}
              onChange={(e) => updateCustomization({ textPosition: e.target.value as 'inside' | 'above' })}
            >
              <option value="inside">Inside</option>
              <option value="above">Above</option>
            </select>
          </label>
          <label>
            Text Align:
            <select
              value={localCustomization.textAlign || 'center'}
              onChange={(e) => updateCustomization({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label>
            Overcap Format:
            <input
              type="text"
              value={localCustomization.overcapTextFormat || ''}
              placeholder="{current}/{max} (+{diff})"
              onChange={(e) => updateCustomization({ overcapTextFormat: e.target.value })}
              style={{ width: '100%' }}
            />
            <small style={{ opacity: .65 }}>Use placeholders: {'{current} {max} {diff}'}</small>
          </label>
          <label>
            Overcap Text Color:
            <input
              type="color"
              value={localCustomization.overcapTextColor || '#ffffff'}
              onChange={(e) => updateCustomization({ overcapTextColor: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={localCustomization.textShadow !== false}
              onChange={(e) => updateCustomization({ textShadow: e.target.checked })}
            />
            Text Shadow
          </label>
        </div>

        {/* Gradient Settings Only */}
        <div className="settings-section">
          <h4>Gradients</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(['hp', 'adrenaline', 'prayer', 'summoning'] as const).map(key => {
              const grad = localCustomization.gradient?.[key] || { from: localCustomization.colors[key] as string, to: localCustomization.colors[key] as string };
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '90px repeat(3, min-content)', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  {/* Gradient from */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <small style={{ opacity: .6 }}>From</small>
                    <input type="color" value={grad.from}
                      onChange={(e) => updateCustomization({ gradient: { ...(localCustomization.gradient || { orientation: 'horizontal' }), [key]: { ...grad, from: e.target.value } } })} />
                  </div>
                  {/* Gradient to */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <small style={{ opacity: .6 }}>To</small>
                    <input type="color" value={grad.to}
                      onChange={(e) => updateCustomization({ gradient: { ...(localCustomization.gradient || { orientation: 'horizontal' }), [key]: { ...grad, to: e.target.value } } })} />
                  </div>
                  {/* Preview */}
                  <div style={{ width: 60, height: 24, border: '1px solid #444', borderRadius: 4, background: `linear-gradient(${(localCustomization.gradient?.orientation || 'horizontal') === 'horizontal' ? '90deg' : '180deg'}, ${grad.from}, ${grad.to})` }} />
                </div>
              );
            })}
            {/* Other colors (non-base) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                Low HP
                <input type="color" value={localCustomization.colors.hpLow}
                  onChange={(e) => updateColors('hpLow', e.target.value)} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                Text
                <input type="color" value={localCustomization.colors.text}
                  onChange={(e) => updateColors('text', e.target.value)} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                Border
                <input type="color" value={localCustomization.colors.border}
                  onChange={(e) => updateColors('border', e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                Orientation
                <select
                  value={localCustomization.gradient?.orientation || 'horizontal'}
                  onChange={(e) => updateCustomization({ gradient: { ...(localCustomization.gradient || {}), orientation: e.target.value as 'horizontal' | 'vertical' } })}
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="settings-section">
          <h4>Behavior</h4>
          <label>
            Low HP Threshold:
            <input
              type="range"
              min="10"
              max="50"
              value={localCustomization.lowHpThreshold}
              onChange={(e) => updateCustomization({ lowHpThreshold: parseInt(e.target.value) })}
            />
            <span>{customization.lowHpThreshold}%</span>
          </label>
          <label>
            Update Interval (ms):
            <input
              type="number"
              value={localCustomization.updateIntervalMs}
              onChange={(e) => updateCustomization({ updateIntervalMs: parseInt(e.target.value) })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={localCustomization.alwaysOnTop}
              onChange={(e) => updateCustomization({ alwaysOnTop: e.target.checked })}
            />
            Always on Top
          </label>
          <label>
            <input
              type="checkbox"
              checked={localCustomization.hideWhenFull}
              onChange={(e) => updateCustomization({ hideWhenFull: e.target.checked })}
            />
            Hide When Full
          </label>
        </div>


        {/* Reset Button */}
        <div className="settings-section">
          <button
            className="reset-button"
            onClick={() => {
              // Import and use default settings
              import('../config/defaults').then(({ defaultCustomization }) => {
                setLocalCustomization(defaultCustomization);
                scheduleParentUpdate(defaultCustomization, true);
              });
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
