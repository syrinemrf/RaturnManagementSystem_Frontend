import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'qualitrack_theme';
  isDark = signal(this.loadTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem(this.THEME_KEY, dark ? 'dark' : 'light');
    });
  }

  private loadTheme(): boolean {
    const stored = localStorage.getItem(this.THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }
}
