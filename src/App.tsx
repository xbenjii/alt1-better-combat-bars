import './App.css'

import { ColortTriplet, findReadLine } from 'alt1/ocr';
import { ImageDetect, captureHold, captureHoldFullRs, imageDataFromUrl } from 'alt1';
import { LifeState, OverlayCustomization } from './types';
import { useEffect, useState } from 'react'

import AdrenalineOff from './assets/adrenaline_off_transparent.png';
import AdrenalineOn from './assets/adrenaline_transparent.png';
import { Alt1Overlay } from './utils/Alt1Overlay';
import { CustomizationPanel } from './components/CustomizationPanel';
import Hp from './assets/hp_transparent.png';
import PrayerOff from './assets/prayer_off_transparent.png';
import PrayerOn from './assets/prayer_transparent.png';
import Summoning from './assets/summoning_transparent.png';
import { defaultCustomization } from './config/defaults';
import font from 'alt1/fonts/aa_8px_mono.js';

const UPDATE_INTERVAL = 1000; // 1 second
const GAME_TICK_UPDATE_INTERVAL = 600; // game tick is 0.6s

// Save and load customization settings
const saveCustomization = (customization: OverlayCustomization) => {
  try {
    localStorage.setItem('combat-overlay-settings', JSON.stringify(customization));
  } catch (error) {
    console.error('Failed to save customization settings:', error);
  }
};

const loadCustomization = (): OverlayCustomization => {
  try {
    const saved = localStorage.getItem('combat-overlay-settings');
    if (saved) {
      return { ...defaultCustomization, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load customization settings:', error);
  }
  return defaultCustomization;
};

function App() {
  const [rsWindowImage, setRsWindowImage] = useState<ImageData | null>(null);
  interface CombatIcons {
    hp: ImageData;
    adrenaline_on: ImageData;
    adrenaline_off: ImageData;
    prayer_on: ImageData;
    prayer_off: ImageData;
    summoning: ImageData;
  }
  const [combatIcons, setCombatIcons] = useState<CombatIcons | null>(null);
  const [states, setStates] = useState<LifeState>({
    hp: 100,
    hpMax: 100,
    adrenaline: 0,
    prayer: 100,
    prayerMax: 100,
    summoning: 0,
    summoningMax: 100,
  });
  const [customization, setCustomization] = useState<OverlayCustomization>(loadCustomization());
  const [showCustomization, setShowCustomization] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [overlay, setOverlay] = useState<Alt1Overlay | null>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [detected, setDetected] = useState(false); // has at least one real stat detection occurred?
  const [iconPositions, setIconPositions] = useState<{ hp?: { x: number; y: number }; adrenaline?: { x: number; y: number }; prayer?: { x: number; y: number }; summoning?: { x: number; y: number }; }>({});
  const [captureRegion, setCaptureRegion] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [failedReads, setFailedReads] = useState(0);
  interface OcrLine { text: string }

  // Save customization when it changes
  useEffect(() => {
    saveCustomization(customization);
  }, [customization]);

  // Create overlay only after first successful detection
  useEffect(() => {
    if (!detected) return;
    if (overlay) return; // already created
    if (window.alt1 && window.alt1.permissionOverlay) {
      const newOverlay = new Alt1Overlay(customization, states);
      newOverlay.createOverlay();
      setOverlay(newOverlay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detected]);

  // Update overlay visibility when overlayEnabled changes
  useEffect(() => {
    if (overlay) {
      overlay.setVisible(overlayEnabled);
    }
  }, [overlayEnabled, overlay]);

  // Update overlay when customization changes
  useEffect(() => {
    if (overlay) {
      overlay.updateCustomization(customization);
    }
  }, [overlay, customization]);

  // Update overlay when states change
  useEffect(() => {
    if (overlay) {
      overlay.updateStates(states);
    }
  }, [overlay, states]);

  useEffect(() => {
    const loadCombatIcons = async () => {
      const combatIcons = await ImageDetect.webpackImages({
        hp: imageDataFromUrl(Hp),
        adrenaline_on: imageDataFromUrl(AdrenalineOn),
        adrenaline_off: imageDataFromUrl(AdrenalineOff),
        prayer_on: imageDataFromUrl(PrayerOn),
        prayer_off: imageDataFromUrl(PrayerOff),
        summoning: imageDataFromUrl(Summoning),
      });
      setCombatIcons(combatIcons);
    };
    loadCombatIcons();
  }, []);



  useEffect(() => {
    const interval = setInterval(async () => {
      // Use restricted capture once region known, else full window
      const rsWindow = captureRegion
        ? captureHold(captureRegion.x, captureRegion.y, captureRegion.w, captureRegion.h)
        : captureHoldFullRs();
      const currentImageData = rsWindow.toData();
      setRsWindowImage(currentImageData);

      if (combatIcons) {
        // If we already locked positions, skip subimage searches
        let hpIconPos: { x: number; y: number }[] = [];
        let adrenalinePos: { x: number; y: number }[] = [];
        let prayerPos: { x: number; y: number }[] = [];
        let summoningPosArr: { x: number; y: number }[] = [];

        if (!iconPositions.hp) {
          hpIconPos = rsWindow.findSubimage(combatIcons.hp).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        }
        // Detect adrenaline icon (on/off) every tick to track changes
        const adOnArr = rsWindow.findSubimage(combatIcons.adrenaline_on).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        const adOffArr = adOnArr.length ? [] : rsWindow.findSubimage(combatIcons.adrenaline_off).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        const adOnDetected = adOnArr.length > 0;
        if (!iconPositions.adrenaline) {
          adrenalinePos = adOnArr.length ? adOnArr : adOffArr;
        }
        // Detect prayer icon (on/off) every tick
        const prOnArr = rsWindow.findSubimage(combatIcons.prayer_on).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        const prOffArr = prOnArr.length ? [] : rsWindow.findSubimage(combatIcons.prayer_off).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        const prayerOnDetected = prOnArr.length > 0;
        if (!iconPositions.prayer) {
          prayerPos = prOnArr.length ? prOnArr : prOffArr;
        }
        if (!iconPositions.summoning) {
          summoningPosArr = rsWindow.findSubimage(combatIcons.summoning).map(p => ({ x: p.x + (captureRegion ? captureRegion.x : 0), y: p.y + (captureRegion ? captureRegion.y : 0) }));
        }

        // Merge newly found positions
        if (!iconPositions.hp && hpIconPos.length) iconPositions.hp = hpIconPos[0];
        if (!iconPositions.adrenaline && (adrenalinePos.length || adOnArr.length || adOffArr.length)) iconPositions.adrenaline = (adrenalinePos[0] || adOnArr[0] || adOffArr[0]);
        if (!iconPositions.prayer && (prayerPos.length || prOnArr.length || prOffArr.length)) iconPositions.prayer = (prayerPos[0] || prOnArr[0] || prOffArr[0]);
        if (!iconPositions.summoning && summoningPosArr.length) iconPositions.summoning = summoningPosArr[0];
        // Trigger state update if any new
        if ((hpIconPos.length || adrenalinePos.length || prayerPos.length || summoningPosArr.length) && !captureRegion) {
          setIconPositions({ ...iconPositions });
        }

        // Compute capture region once we have at least hp + (prayer or adrenaline)
        if (!captureRegion && iconPositions.hp && (iconPositions.prayer || iconPositions.adrenaline)) {
          const coords = Object.values(iconPositions) as { x: number; y: number }[];
          if (coords.length) {
            const xs = coords.map(c => c.x);
            const ys = coords.map(c => c.y);
            const minX = Math.max(0, Math.min(...xs) - 15);
            const minY = Math.max(0, Math.min(...ys) - 20);
            const maxX = Math.max(...xs) + 140; // allow room for text to the right
            const maxY = Math.max(...ys) + 50;   // allow room for text height
            setCaptureRegion({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
          }
        }

        const color: ColortTriplet = [255, 255, 255];

        // Helper to get global to local offset for restricted capture
        const regionOffsetX = captureRegion ? captureRegion.x : 0;
        const regionOffsetY = captureRegion ? captureRegion.y : 0;

        const hpBase = iconPositions.hp || (hpIconPos.length ? hpIconPos[0] : undefined);
        const hp: OcrLine = hpBase ? findReadLine(
          currentImageData,
          font,
          [color],
          hpBase.x - regionOffsetX + 22,
          hpBase.y - regionOffsetY - 5,
          100,
          25
        ) : { text: '' };
        const [hpCurStr, hpMaxStr] = hp.text.split('/').map((s: string) => s.replace(',', '').trim());
        const hpValue = parseInt(hpCurStr);
        const hpMax = parseInt(hpMaxStr);

        const adBase = iconPositions.adrenaline || adrenalinePos[0];
        const adrenaline: OcrLine = adBase ? findReadLine(
          currentImageData,
          font,
          [color],
          adBase.x - regionOffsetX + 22,
          adBase.y - regionOffsetY - 5,
          100,
          25
        ) : { text: '' };
        const adrenalineValue = parseInt(adrenaline.text.replace('%', '').trim());

        const prayerBase = iconPositions.prayer || prayerPos[0];
        const prayer: OcrLine = prayerBase ? findReadLine(
          currentImageData,
          font,
          [color],
          prayerBase.x - regionOffsetX + 22,
          prayerBase.y - regionOffsetY - 5,
          100,
          25
        ) : { text: '' };
        const [prayerCurStr, prayerMaxStr] = prayer.text.split('/').map((s: string) => s.trim());
        const prayerValue = parseInt(prayerCurStr.replace(',', '').trim());
        const prayerMax = parseInt(prayerMaxStr.replace(',', '').trim());

        const summoningBase = iconPositions.summoning || summoningPosArr[0];
        const summoning: OcrLine = summoningBase ? findReadLine(
          currentImageData,
          font,
          [color],
          summoningBase.x - regionOffsetX + 22,
          summoningBase.y - regionOffsetY - 5,
          100,
          25
        ) : { text: '' };
        const [summoningCurStr, summoningMaxStr] = summoning.text.split('/').map((s: string) => s.trim());
        const summoningValue = parseInt(summoningCurStr.replace(',', '').trim());
        const summoningMax = parseInt(summoningMaxStr.replace(',', '').trim());

        setStates((prevStates) => ({
          ...prevStates,
          hp: isNaN(hpValue) ? prevStates.hp : hpValue,
          hpMax: isNaN(hpMax) ? prevStates.hpMax : hpMax,
          adrenaline: isNaN(adrenalineValue) ? prevStates.adrenaline : adrenalineValue,
          prayer: isNaN(prayerValue) ? prevStates.prayer : prayerValue,
          prayerMax: isNaN(prayerMax) ? prevStates.prayerMax : prayerMax,
          summoning: isNaN(summoningValue) ? prevStates.summoning : summoningValue,
          summoningMax: isNaN(summoningMax) ? prevStates.summoningMax : summoningMax,
          adrenalineActive: adOnDetected,
          prayerActive: prayerOnDetected,
        }));

        const anyValid = !isNaN(hpValue) || !isNaN(prayerValue) || !isNaN(adrenalineValue) || !isNaN(summoningValue);
        if (!anyValid) {
          setFailedReads(fr => fr + 1);
        } else if (failedReads) {
          setFailedReads(0);
        }

        // If repeated failures, reset region & positions to re-detect
        if (failedReads > 3) {
          setCaptureRegion(null);
          setIconPositions({});
          setFailedReads(0);
        }

        // Determine if we have a reliable initial detection (all primary values parsed once)
        const gotHp = !isNaN(hpValue) && !isNaN(hpMax);
        const gotPrayer = !isNaN(prayerValue) && !isNaN(prayerMax);
        const gotAdren = !isNaN(adrenalineValue);
        // Require at least HP + Prayer OR HP + Adrenaline for confidence
        if (!detected && ((gotHp && gotPrayer) || (gotHp && gotAdren))) {
          setDetected(true);
        }
      }
    }, captureRegion ? GAME_TICK_UPDATE_INTERVAL : UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [combatIcons, detected, captureRegion, iconPositions, failedReads]);

  if (!rsWindowImage) {
    return <div>Loading...</div>;
  }

  return (
      <div className="app-container">
        {/* Status Display */}
        <div className="status-panel">
          <h3>Better Combat Bars</h3>
          <div className="status-info">
            <div className="status-item">
              <span className={`status-indicator ${window.alt1 ? 'ready' : 'loading'}`}></span>
              Alt1: {window.alt1 ? 'Connected' : 'Not detected'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${window.alt1?.permissionOverlay ? 'ready' : 'loading'}`}></span>
              Overlay: {window.alt1?.permissionOverlay ? 'Enabled' : 'No permission'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${overlay ? 'ready' : 'loading'}`}></span>
              Overlay Active: {overlay ? 'Yes' : 'No'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${detected ? 'ready' : 'loading'}`}></span>
              Detection: {detected ? 'Ready' : 'Waiting'}
            </div>
          </div>

          <div className="current-stats">
            <h4>Current Stats</h4>
            <div className="stats-grid">
              <div>HP: {states.hp}/{states.hpMax}</div>
              <div>Adrenaline: {states.adrenaline}%</div>
              <div>Prayer: {states.prayer}/{states.prayerMax}</div>
              <div>Summoning: {states.summoning}/{states.summoningMax}</div>
              <div>Auto Retaliate: {states.adrenalineActive ? 'On' : 'Off'}</div>
              <div>Prayer Active: {states.prayerActive ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="overlay-controls">
            <button
              onClick={() => setOverlayEnabled(!overlayEnabled)}
              className={`toggle-button ${overlayEnabled ? 'active' : ''}`}
            >
              {overlayEnabled ? 'Disable Overlay' : 'Enable Overlay'}
            </button>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="toggle-button"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>
        </div>

        {/* Customization Panel */}
        <CustomizationPanel
          customization={customization}
          onCustomizationChange={setCustomization}
          isVisible={showCustomization}
          onToggle={() => setShowCustomization(!showCustomization)}
        />

        {/* Debug Panel */}
        <div className='debug-panel' style={{ display: showDebug ? 'block' : 'none' }}>
          <h4>Debug Info</h4>
          <canvas
            style={{
              zoom: 0.3,
              border: '1px solid #ccc',
            }}
            ref={(canvas) => {
              if (canvas && rsWindowImage) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = rsWindowImage.width;
                  canvas.height = rsWindowImage.height;
                  ctx.putImageData(rsWindowImage, 0, 0);
                }
              }
            }}
          />
          <pre>{JSON.stringify(states, null, 2)}</pre>
          <pre>Capture Region: {captureRegion ? `${captureRegion.x},${captureRegion.y} (${captureRegion.w}x${captureRegion.h})` : 'Not set'}</pre>
          <pre>Icon Positions: {JSON.stringify(iconPositions)}</pre>
          <pre>Failed Reads: {failedReads}</pre>
        </div>

        {/* Credits Panel */}
        <div className="credits-panel">
          <div className="credits-content">
            <div className="credits-author">
              Made by <a href="https://www.xbenjii.co.uk" target="_blank" rel="noopener noreferrer">xbenjii</a>
            </div>
            <div className="credits-links">
              <a 
                href="https://github.com/xbenjii/alt1-better-combat-bars/issues/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="report-issue-btn"
              >
                🐛 Report an Issue on Github
              </a>
              <a 
                href="https://discord.com/users/440297813465759755" 
                target="_blank" 
                rel="noopener noreferrer"
                className="discord-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.191.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Contact on Discord
              </a>
            </div>
          </div>
        </div>
      </div>
  )
}

export default App
