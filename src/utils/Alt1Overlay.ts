import { LifeState, OverlayCustomization } from '../types';

import AdrenalineOff from '../assets/adrenaline_off_transparent.png';
import AdrenalineOn from '../assets/adrenaline_transparent.png';
import Hp from '../assets/hp_transparent.png';
import PrayerOff from '../assets/prayer_off_transparent.png';
import PrayerOn from '../assets/prayer_transparent.png';
import Summoning from '../assets/summoning_transparent.png';
import { mixColor } from 'alt1';

export class Alt1Overlay {
  private overlayGroup: string;
  private customization: OverlayCustomization;
  private states: LifeState;
  private isVisible: boolean = true;
  private updateInterval: number | null = null;
  private lastRenderedStates: string = '';
  private lastRenderedCustomization: string = '';
  private isRendering: boolean = false;

  constructor(customization: OverlayCustomization, states: LifeState) {
    this.customization = customization;
    this.states = states;
    this.overlayGroup = 'combat-bars-' + Date.now();
  }

  public createOverlay(): void {
    if (!window.alt1) {
      console.error('Alt1 not available');
      return;
    }

    if (!window.alt1.permissionOverlay) {
      console.error('Alt1 overlay permission not granted');
      return;
    }

    // Set the overlay group
    window.alt1.overLaySetGroup(this.overlayGroup);
    window.alt1.overLaySetGroupZIndex(this.overlayGroup, this.customization.alwaysOnTop ? 1000 : 100);

    // Start rendering
    this.render();

    // Set up periodic refresh to prevent overlay disappearing (every 20 seconds)
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateInterval = window.setInterval(() => {
      if (this.isVisible) {
        this.render();
      }
    }, 20000);
  }

  public updateStates(newStates: LifeState): void {
    this.states = newStates;
    if (this.isVisible) {
      // Only render if states actually changed
      const statesString = JSON.stringify(newStates);
      if (statesString !== this.lastRenderedStates) {
        this.render();
      }
    }
  }

  public updateCustomization(newCustomization: OverlayCustomization): void {
    this.customization = newCustomization;

    // Update z-index if needed
    if (window.alt1) {
      window.alt1.overLaySetGroupZIndex(this.overlayGroup, newCustomization.alwaysOnTop ? 1000 : 100);
    }

    if (this.isVisible) {
      // Only render if customization actually changed
      const customizationString = JSON.stringify(newCustomization);
      if (customizationString !== this.lastRenderedCustomization) {
        this.render();
      }
    }
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (!window.alt1) return;

    if (visible) {
      this.render();
    } else {
      window.alt1.overLayClearGroup(this.overlayGroup);
    }
  }

  public destroyOverlay(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (window.alt1) {
      window.alt1.overLayClearGroup(this.overlayGroup);
    }
  }

  private async render(): Promise<void> {
    if (!window.alt1 || !this.isVisible || this.isRendering) return;

    this.isRendering = true;
    try {
      // Clear when customization or states changed (or first render) so old text doesn't accumulate
      const customizationChanged = JSON.stringify(this.customization) !== this.lastRenderedCustomization;
      const statesChanged = JSON.stringify(this.states) !== this.lastRenderedStates;
      const firstRender = this.lastRenderedStates === '';

      if (customizationChanged || statesChanged || firstRender) {
        window.alt1.overLayClearGroup(this.overlayGroup);
      }

      window.alt1.overLaySetGroup(this.overlayGroup);

      // Calculate positions & theme layout overrides
      const gap = this.customization.themeLayout?.gap ?? 8;
      const startX = Math.round(this.customization.position.x + gap);
      const startY = Math.round(this.customization.position.y + gap);
      let x = startX;
      let y = startY;
      let barIndex = 0;
      let topRowHeight = startY;

      const orderedTypes: ("hp" | "prayer" | "summoning" | "adrenaline")[] = this.customization.themeLayout?.order ?? ['hp', 'prayer', 'summoning', 'adrenaline'];
      const bars = orderedTypes.map(t => {
        switch (t) {
          case 'hp': return { type: 'hp', show: this.customization.showHP, current: this.states.hp, max: this.states.hpMax };
          case 'prayer': return { type: 'prayer', show: this.customization.showPrayer, current: this.states.prayer, max: this.states.prayerMax };
          case 'summoning': return { type: 'summoning', show: this.customization.showSummoning, current: this.states.summoning, max: this.states.summoningMax };
          case 'adrenaline': return { type: 'adrenaline', show: this.customization.showAdrenaline, current: this.states.adrenaline, max: 100 };
        }
      });

      // Draw bars sequentially to avoid race conditions
      const textAbove = (this.customization.textPosition === 'above');
      const textLineHeight = textAbove ? (this.customization.fontSize + 4) : 0; // extra spacing
      for (const bar of bars) {
        if (!bar.show) continue;

        // Check if we have valid data for the bar
        // Adrenaline always has max 100, others need valid max values
        const hasValidData = bar.type === 'adrenaline' || (bar.max !== undefined && bar.max !== null && bar.max > 0);
        if (!hasValidData) continue;

        const shouldHide = this.customization.hideWhenFull && bar.current === bar.max;
        if (shouldHide) continue;

        // Special positioning and sizing for adrenaline in horizontal layout
        if (this.customization.layout === 'horizontal' && bar.type === 'adrenaline' && (this.customization.themeLayout?.adrenalineFullWidth ?? true)) {
          // Position adrenaline directly beneath the first row.
          // If text is above bars, reserve exactly one text line for adrenaline's own text (not two plus gap).
          x = startX;
          const adrenalineExtraMargin = 5; // subtle separation from first row
          y = textAbove
            ? (startY + this.customization.barHeight + textLineHeight + adrenalineExtraMargin)
            : (startY + this.customization.barHeight + adrenalineExtraMargin);

          // Calculate how many bars are shown in the top row (excluding adrenaline)
          const topRowBars = bars.filter(b => b.show && b.type !== 'adrenaline' &&
            (b.type === 'adrenaline' || (b.max !== undefined && b.max !== null && b.max > 0)) &&
            !(this.customization.hideWhenFull && b.current === b.max)).length;

          // Calculate full width: (number of bars * bar width) + (gaps between bars)
          const fullWidth = (topRowBars * this.customization.barWidth) + ((topRowBars - 1) * gap);

          // Draw adrenaline bar with full width
          await this.drawSingleBarWithWidth(bar.type as 'hp' | 'adrenaline' | 'prayer' | 'summoning', bar.current, bar.max || 100, x, y, fullWidth);
        } else {
          await this.drawSingleBar(bar.type as 'hp' | 'adrenaline' | 'prayer' | 'summoning', bar.current, bar.max || 100, x, y);
        }

        // Calculate next position based on layout
        switch (this.customization.layout) {
          case 'horizontal':
            if (!(bar.type === 'adrenaline' && (this.customization.themeLayout?.adrenalineFullWidth ?? true))) {
              x = Math.round(x + this.customization.barWidth + gap);
              topRowHeight = Math.max(topRowHeight, y + (textAbove ? textLineHeight : 0));
            }
            break;
          case 'vertical':
            y = Math.round(y + this.customization.barHeight + gap + (textAbove ? textLineHeight : 0));
            break;
          case 'compact':
            if (barIndex % 2 === 0) {
              x = Math.round(x + this.customization.barWidth + gap);
            } else {
              x = startX;
              y = Math.round(y + this.customization.barHeight + gap + (textAbove ? textLineHeight : 0));
            }
            break;
          case 'minimal':
            x = Math.round(x + this.customization.barWidth + gap / 2);
            break;
        }

        barIndex++;
      }

      // Update cached states and customization
      this.lastRenderedStates = JSON.stringify(this.states);
      this.lastRenderedCustomization = JSON.stringify(this.customization);

    } catch (error) {
      console.error('Failed to render overlay:', error);
    } finally {
      this.isRendering = false;
    }
  }

  private async drawSingleBarWithWidth(
    type: 'hp' | 'adrenaline' | 'prayer' | 'summoning',
    current: number,
    max: number,
    x: number,
    y: number,
    customWidth: number
  ): Promise<void> {
    if (!window.alt1) return;

    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    const barWidth = Math.round(customWidth);
    const barHeight = Math.round(this.customization.barHeight);
    const displayTime = 30000; // 30 seconds - very long to prevent disappearing

    // Ensure all coordinates are integers
    const intX = Math.round(x);
    const intY = Math.round(y);

    // Icon sits outside (to the left) of the bordered bar now
    const iconAreaWidth = this.customization.showIcons ? 20 : 0;
    const gapBetweenIconAndBar = this.customization.showIcons ? 4 : 0;
    const progressBarX = intX + iconAreaWidth + gapBetweenIconAndBar;
    const progressBarWidth = barWidth - iconAreaWidth - gapBetweenIconAndBar;

    // Draw background using solid color images (derived from theme background color)
    const opacity = Math.round(this.customization.opacity * 255);

    const bgRGBA = this.parseColor(this.customization.colors.background, opacity);
    if (progressBarWidth > 0 && barHeight > 0) {
      const bgImage = this.createSolidColorImage(progressBarWidth, barHeight, bgRGBA.r, bgRGBA.g, bgRGBA.b, bgRGBA.a);
      window.alt1.overLayImage(progressBarX, intY, bgImage, progressBarWidth, displayTime);
    }

    // Border color from theme
    const borderRGBA = this.parseColor(this.customization.colors.border, opacity);
    const borderColor = mixColor(borderRGBA.r, borderRGBA.g, borderRGBA.b, borderRGBA.a);
    window.alt1.overLayRect(borderColor, progressBarX, intY, progressBarWidth, 1, displayTime, 1); // Top
    window.alt1.overLayRect(borderColor, progressBarX, intY + barHeight - 1, progressBarWidth, 1, displayTime, 1); // Bottom
    window.alt1.overLayRect(borderColor, progressBarX, intY, 1, barHeight, displayTime, 1); // Left
    window.alt1.overLayRect(borderColor, progressBarX + progressBarWidth - 1, intY, 1, barHeight, displayTime, 1); // Right

    // Load and draw the stat image in the icon area (only if showIcons is enabled)
    if (this.customization.showIcons) {
      const imagePath = this.getStatImagePath(type, current);
      const imageData = await this.loadImageAsBase64(imagePath);

      if (imageData) {
        // Center the icon in the icon area
        const iconX = intX + (iconAreaWidth - imageData.width) / 2; // left of bar border
        const iconY = intY + (barHeight - imageData.width) / 2; // Assuming square icons
        window.alt1.overLayImage(Math.round(iconX), Math.round(iconY), imageData.data, imageData.width, displayTime);
      }
    }

    // Draw progress fill with authentic RuneScape colors
    if (percentage > 0) {
      const fillWidth = Math.round((progressBarWidth - 4) * (percentage / 100));
      const fillHeight = barHeight - 4;

      if (fillWidth > 0 && fillHeight > 0) {
        const baseColor = this.getBarColor(type, current, max);
        let progressImage: string;
        if (this.customization.gradient) {
          const gradConf = this.getGradientFor(type);
          if (gradConf) {
            const fromRGBA = this.parseColor(gradConf.from, opacity);
            const toRGBA = this.parseColor(gradConf.to, opacity);
            progressImage = this.createGradientImage(fillWidth, fillHeight, fromRGBA, toRGBA, this.customization.gradient.orientation || 'horizontal');
          } else {
            progressImage = this.createSolidColorImage(fillWidth, fillHeight, baseColor.r, baseColor.g, baseColor.b, opacity);
          }
        } else {
          progressImage = this.createSolidColorImage(fillWidth, fillHeight, baseColor.r, baseColor.g, baseColor.b, opacity);
        }
        window.alt1.overLayImage(progressBarX + 2, intY + 2, progressImage, fillWidth, displayTime);
      }
    }

    // Draw text overlay
    if (this.customization.showText) {
      const above = this.customization.textPosition === 'above';
      const baseY = above ? Math.round(intY - 2 - this.customization.fontSize / 2) : Math.round(intY + barHeight / 2);
      if (current > max) {
        const diff = current - max;
        const fmt = this.customization.overcapTextFormat || '{current}/{max} (+{diff})';
        const normalColor = this.parseColor(this.customization.colors.text, 255);
        const overColor = this.parseColor(this.customization.overcapTextColor || this.customization.colors.text, 255);
        const segments: { text: string; color: { r: number; g: number; b: number; a: number } }[] = [];
        const regex = /\{current\}|\{max\}|\{diff\}/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(fmt)) !== null) {
          if (match.index > lastIndex) {
            const raw = fmt.slice(lastIndex, match.index);
            if (raw) segments.push({ text: raw, color: normalColor });
          }
          const token = match[0];
          let value = '';
          let color = normalColor;
          switch (token) {
            case '{current}': value = current.toString(); color = overColor; break;
            case '{max}': value = max.toString(); break;
            case '{diff}': value = diff.toString(); break;
          }
          segments.push({ text: value, color });
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < fmt.length) {
          const tail = fmt.slice(lastIndex);
          if (tail) segments.push({ text: tail, color: normalColor });
        }
        // If user forgot {current}, fallback to default standard text
        if (!segments.some(s => s.color === overColor)) {
          const text = max === 100 ? `${current}%` : `${current}/${max}`;
          const textRGBA = this.parseColor(this.customization.colors.text, 255);
          this.drawTextSegments([{ text, color: textRGBA }], progressBarX, progressBarWidth, baseY, displayTime);
        } else {
          // Percent style nuance: if max==100 and format omitted % sign, we don't auto add; assume user controls it.
          this.drawTextSegments(segments, progressBarX, progressBarWidth, baseY, displayTime);
        }
      } else {
        const text = max === 100 ? `${current}%` : `${current}/${max}`;
        const textRGBA = this.parseColor(this.customization.colors.text, 255);
        this.drawTextSegments([{ text, color: textRGBA }], progressBarX, progressBarWidth, baseY, displayTime);
      }
    }
  }

  private async drawSingleBar(
    type: 'hp' | 'adrenaline' | 'prayer' | 'summoning',
    current: number,
    max: number,
    x: number,
    y: number
  ): Promise<void> {
    if (!window.alt1) return;

    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    const barWidth = Math.round(this.customization.barWidth);
    const barHeight = Math.round(this.customization.barHeight);
    const displayTime = 30000; // 30 seconds - very long to prevent disappearing

    // Ensure all coordinates are integers
    const intX = Math.round(x);
    const intY = Math.round(y);

    // RuneScape-style layout: icon area + progress bar
    const iconAreaWidth = this.customization.showIcons ? 20 : 0;
    const gapBetweenIconAndBar = this.customization.showIcons ? 4 : 0;
    const progressBarX = intX + iconAreaWidth + gapBetweenIconAndBar;
    const progressBarWidth = barWidth - iconAreaWidth - gapBetweenIconAndBar;

    // Draw background using solid color images (theme aware)
    const opacity = Math.round(this.customization.opacity * 255);
    const bgRGBA = this.parseColor(this.customization.colors.background, opacity);
    if (progressBarWidth > 0 && barHeight > 0) {
      const bgImage = this.createSolidColorImage(progressBarWidth, barHeight, bgRGBA.r, bgRGBA.g, bgRGBA.b, bgRGBA.a);
      window.alt1.overLayImage(progressBarX, intY, bgImage, progressBarWidth, displayTime);
    }

    // Border
    const borderRGBA = this.parseColor(this.customization.colors.border, opacity);
    const borderColor = mixColor(borderRGBA.r, borderRGBA.g, borderRGBA.b, borderRGBA.a);
    window.alt1.overLayRect(borderColor, progressBarX, intY, progressBarWidth, 1, displayTime, 1); // Top
    window.alt1.overLayRect(borderColor, progressBarX, intY + barHeight - 1, progressBarWidth, 1, displayTime, 1); // Bottom
    window.alt1.overLayRect(borderColor, progressBarX, intY, 1, barHeight, displayTime, 1); // Left
    window.alt1.overLayRect(borderColor, progressBarX + progressBarWidth - 1, intY, 1, barHeight, displayTime, 1); // Right

    // Removed icon area highlight background for transparent look behind icons

    // Load and draw the stat image in the icon area (only if showIcons is enabled)
    if (this.customization.showIcons) {
      const imagePath = this.getStatImagePath(type, current);
      const imageData = await this.loadImageAsBase64(imagePath);

      if (imageData) {
        // Center the icon in the icon area
        const iconX = intX + (iconAreaWidth - imageData.width) / 2; // left of bar border
        const iconY = intY + (barHeight - imageData.width) / 2; // Assuming square icons
        window.alt1.overLayImage(Math.round(iconX), Math.round(iconY), imageData.data, imageData.width, displayTime);
      }
    }

    // Draw progress fill with authentic RuneScape colors
    if (percentage > 0) {
      const fillWidth = Math.round((progressBarWidth - 4) * (percentage / 100));
      const fillHeight = barHeight - 4;

      if (fillWidth > 0 && fillHeight > 0) {
        const baseColor = this.getBarColor(type, current, max);
        let progressImage: string;
        if (this.customization.gradient) {
          const gradConf = this.getGradientFor(type);
          if (gradConf) {
            const fromRGBA = this.parseColor(gradConf.from, opacity);
            const toRGBA = this.parseColor(gradConf.to, opacity);
            progressImage = this.createGradientImage(fillWidth, fillHeight, fromRGBA, toRGBA, this.customization.gradient.orientation || 'horizontal');
          } else {
            progressImage = this.createSolidColorImage(fillWidth, fillHeight, baseColor.r, baseColor.g, baseColor.b, opacity);
          }
        } else {
          progressImage = this.createSolidColorImage(fillWidth, fillHeight, baseColor.r, baseColor.g, baseColor.b, opacity);
        }
        window.alt1.overLayImage(progressBarX + 2, intY + 2, progressImage, fillWidth, displayTime);
      }
    }

    // Draw text overlay
    if (this.customization.showText) {
      const above = this.customization.textPosition === 'above';
      const baseY = above ? Math.round(intY - 2 - this.customization.fontSize / 2) : Math.round(intY + barHeight / 2);
      if (current > max) {
        const diff = current - max;
        const fmt = this.customization.overcapTextFormat || '{current}/{max} (+{diff})';
        const normalColor = this.parseColor(this.customization.colors.text, 255);
        const overColor = this.parseColor(this.customization.overcapTextColor || this.customization.colors.text, 255);
        const segments: { text: string; color: { r: number; g: number; b: number; a: number } }[] = [];
        const regex = /\{current\}|\{max\}|\{diff\}/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(fmt)) !== null) {
          if (match.index > lastIndex) {
            const raw = fmt.slice(lastIndex, match.index);
            if (raw) segments.push({ text: raw, color: normalColor });
          }
          const token = match[0];
          let value = '';
          let color = normalColor;
          switch (token) {
            case '{current}': value = current.toString(); color = overColor; break;
            case '{max}': value = max.toString(); break;
            case '{diff}': value = diff.toString(); break;
          }
          segments.push({ text: value, color });
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < fmt.length) {
          const tail = fmt.slice(lastIndex);
          if (tail) segments.push({ text: tail, color: normalColor });
        }
        if (!segments.some(s => s.color === overColor)) {
          const text = max === 100 ? `${current}%` : `${current}/${max}`;
          const textRGBA = this.parseColor(this.customization.colors.text, 255);
          this.drawTextSegments([{ text, color: textRGBA }], progressBarX, progressBarWidth, baseY, displayTime);
        } else {
          this.drawTextSegments(segments, progressBarX, progressBarWidth, baseY, displayTime);
        }
      } else {
        const text = max === 100 ? `${current}%` : `${current}/${max}`;
        const textRGBA = this.parseColor(this.customization.colors.text, 255);
        this.drawTextSegments([{ text, color: textRGBA }], progressBarX, progressBarWidth, baseY, displayTime);
      }
    }
  }

  private imageCache: Map<string, { data: string; width: number }> = new Map();
  private colorImageCache: Map<string, string> = new Map();

  private createSolidColorImage(width: number, height: number, r: number, g: number, b: number, a: number): string {
    const cacheKey = `${width}x${height}_${r}_${g}_${b}_${a}`;
    if (this.colorImageCache.has(cacheKey)) {
      return this.colorImageCache.get(cacheKey)!;
    }

    // Create BGRA image data for Alt1
    const pixelCount = width * height;
    const bgraData = new Uint8Array(pixelCount * 4);

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      bgraData[idx] = b;     // B
      bgraData[idx + 1] = g; // G
      bgraData[idx + 2] = r; // R
      bgraData[idx + 3] = a; // A
    }

    const base64 = btoa(String.fromCharCode(...bgraData));
    this.colorImageCache.set(cacheKey, base64);
    return base64;
  }

  private createGradientImage(width: number, height: number, from: { r: number; g: number; b: number; a: number }, to: { r: number; g: number; b: number; a: number }, orientation: 'horizontal' | 'vertical'): string {
    const key = `grad_${width}x${height}_${from.r}_${from.g}_${from.b}_${from.a}_${to.r}_${to.g}_${to.b}_${to.a}_${orientation}`;
    if (this.colorImageCache.has(key)) return this.colorImageCache.get(key)!;
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = orientation === 'horizontal' ? (width <= 1 ? 0 : x / (width - 1)) : (height <= 1 ? 0 : y / (height - 1));
        const r = Math.round(from.r + (to.r - from.r) * t);
        const g = Math.round(from.g + (to.g - from.g) * t);
        const b = Math.round(from.b + (to.b - from.b) * t);
        const a = Math.round(from.a + (to.a - from.a) * t);
        const idx = (y * width + x) * 4;
        pixels[idx] = b; pixels[idx + 1] = g; pixels[idx + 2] = r; pixels[idx + 3] = a;
      }
    }
    const base64 = btoa(String.fromCharCode(...pixels));
    this.colorImageCache.set(key, base64);
    return base64;
  }

  private async loadImageAsBase64(imagePath: string): Promise<{ data: string; width: number } | null> {
    // Check cache first
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to convert image to base64 BGRA format
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;

          // Convert RGBA to BGRA format expected by Alt1
          const bgraData = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i += 4) {
            bgraData[i] = data[i + 2];     // B
            bgraData[i + 1] = data[i + 1]; // G
            bgraData[i + 2] = data[i];     // R
            bgraData[i + 3] = data[i + 3]; // A
          }

          // Convert to base64
          const base64 = btoa(String.fromCharCode(...bgraData));

          const result = { data: base64, width: img.width };
          this.imageCache.set(imagePath, result);
          resolve(result);
        };
        img.onerror = () => resolve(null);
        img.src = imagePath;
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  }

  private getStatImagePath(type: 'hp' | 'adrenaline' | 'prayer' | 'summoning', current: number): string {
    switch (type) {
      case 'hp':
        return Hp;
      case 'adrenaline': {
        const flag = (this.states as { adrenalineActive?: boolean }).adrenalineActive;
        // If flag is defined, trust it explicitly (allows showing off icon even when current > 0).
        // If undefined (older state object), fall back to numeric value heuristic.
        const active = flag === undefined ? current > 0 : flag;
        return active ? AdrenalineOn : AdrenalineOff;
      }
      case 'prayer': {
        const flag = (this.states as { prayerActive?: boolean }).prayerActive;
        const active = flag === undefined ? current > 0 : flag;
        return active ? PrayerOn : PrayerOff;
      }
      case 'summoning':
        return Summoning;
      default:
        return Hp;
    }
  }

  // --- Theme Helpers ---
  private parseColor(input: string, fallbackAlpha: number): { r: number; g: number; b: number; a: number } {
    // Supports #rgb, #rrggbb and rgba()/rgb()
    if (input.startsWith('#')) {
      const hex = input.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b, a: fallbackAlpha };
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b, a: fallbackAlpha };
      }
    } else if (input.startsWith('rgb')) {
      const m = input.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map(p => p.trim());
        const r = parseInt(parts[0]);
        const g = parseInt(parts[1]);
        const b = parseInt(parts[2]);
        let a = fallbackAlpha;
        if (parts[3] !== undefined) {
          const alphaFloat = parseFloat(parts[3]);
          a = Math.round(alphaFloat * 255);
        }
        return { r, g, b, a };
      }
    }
    return { r: 255, g: 255, b: 255, a: fallbackAlpha };
  }


  private getBarColor(type: 'hp' | 'adrenaline' | 'prayer' | 'summoning', current: number, max: number): { r: number; g: number; b: number } {
    // For HP we can switch to low color threshold
    let colorStr: string;
    if (type === 'hp') {
      const pct = (current / max) * 100;
      colorStr = pct <= this.customization.lowHpThreshold ? this.customization.colors.hpLow : this.customization.colors.hp;
    } else {
      colorStr = this.customization.colors[type];
    }
    const parsed = this.parseColor(colorStr, 255);
    return { r: parsed.r, g: parsed.g, b: parsed.b };
  }

  private getGradientFor(type: 'hp' | 'adrenaline' | 'prayer' | 'summoning'): { from: string; to: string } | undefined {
    const g = this.customization.gradient;
    if (!g) return undefined;
    switch (type) {
      case 'hp': return g.hp;
      case 'adrenaline': return g.adrenaline;
      case 'prayer': return g.prayer;
      case 'summoning': return g.summoning;
    }
  }

  // --- Text Helpers ---
  private getMonospaceTextWidth(text: string, fontSize: number): number {
    // Approximate monospace glyph width factor; tweakable if needed
    const aspect = 0.6; // empirical average
    return Math.round(text.length * fontSize * aspect);
  }


  private getSegmentStartX(progressBarX: number, progressBarWidth: number, totalWidth: number): number {
    const align = this.customization.textAlign || 'center';
    const leftEdge = progressBarX + 2;
    const usableWidth = progressBarWidth - 4;
    const centerX = leftEdge + usableWidth / 2;
    const rightEdge = leftEdge + usableWidth;
    let overallCenter: number;
    switch (align) {
      case 'left':
        overallCenter = leftEdge + totalWidth / 2; break;
      case 'right':
        overallCenter = rightEdge - totalWidth / 2; break;
      default:
        overallCenter = centerX; break;
    }
    return Math.round(overallCenter - totalWidth / 2);
  }

  private drawTextSegments(
    segments: { text: string; color: { r: number; g: number; b: number; a: number } }[],
    progressBarX: number,
    progressBarWidth: number,
    baseY: number,
    displayTime: number
  ) {
    if (!window.alt1) return;
    const fontSize = this.customization.fontSize;
    const totalWidth = segments.reduce((sum, s) => sum + this.getMonospaceTextWidth(s.text, fontSize), 0);
    let cursorX = this.getSegmentStartX(progressBarX, progressBarWidth, totalWidth);
    for (const seg of segments) {
      const segWidth = this.getMonospaceTextWidth(seg.text, fontSize);
      const centerX = Math.round(cursorX + segWidth / 2);
      const color = mixColor(seg.color.r, seg.color.g, seg.color.b, seg.color.a);
      const shadowColor = mixColor(0, 0, 0, 180);
      const shadowEnabled = this.customization.textShadow !== false; // default on
      window.alt1.overLayTextEx(seg.text, shadowColor, fontSize, centerX + 1, baseY + 1, displayTime, 'Arial', true, shadowEnabled);
      window.alt1.overLayTextEx(seg.text, color, fontSize, centerX, baseY, displayTime, 'Arial', true, shadowEnabled);
      cursorX += segWidth + 2; // slight spacing between segments
    }
  }



}
