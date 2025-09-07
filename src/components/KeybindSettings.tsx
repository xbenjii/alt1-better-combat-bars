import './KeybindSettings.css';

import { OverlayCustomization } from '../types';
import React from 'react';

interface KeybindSettingsProps {
  customization: OverlayCustomization;
  onCustomizationChange: (customization: OverlayCustomization) => void;
}

export const KeybindSettings: React.FC<KeybindSettingsProps> = ({
  customization,
  onCustomizationChange,
}) => {
  const handleKeybindChange = (action: string, key: string) => {
    onCustomizationChange({
      ...customization,
      keybinds: {
        ...customization.keybinds,
        [action]: key,
      },
    });
  };

  return (
    <div className="keybind-settings">
      <h4>Keyboard Shortcuts</h4>
      <div className="keybind-list">
        <div className="keybind-item">
          <label>Toggle Overlay:</label>
          <input
            type="text"
            value={customization.keybinds?.toggleOverlay || 'F1'}
            onChange={(e) => handleKeybindChange('toggleOverlay', e.target.value)}
            placeholder="F1"
          />
        </div>
        <div className="keybind-item">
          <label>Toggle Settings:</label>
          <input
            type="text"
            value={customization.keybinds?.toggleSettings || 'F2'}
            onChange={(e) => handleKeybindChange('toggleSettings', e.target.value)}
            placeholder="F2"
          />
        </div>
        <div className="keybind-item">
          <label>Reset Position:</label>
          <input
            type="text"
            value={customization.keybinds?.resetPosition || 'F3'}
            onChange={(e) => handleKeybindChange('resetPosition', e.target.value)}
            placeholder="F3"
          />
        </div>
      </div>
    </div>
  );
};
