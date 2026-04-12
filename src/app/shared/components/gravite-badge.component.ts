import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gravite } from '../../core/models/nonconformite.model';

@Component({
  selector: 'app-gravite-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="gravite-pill" [style.background]="getConfig().bg" [style.color]="getConfig().color">
      <span class="dot" [style.background]="getConfig().dot"></span>
      {{ getConfig().label }}
    </span>
  `,
  styles: [`
    .gravite-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 8px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `]
})
export class GraviteBadgeComponent {
  @Input() gravite!: Gravite;

  getConfig(): { label: string; bg: string; color: string; dot: string } {
    const map: Record<string, { label: string; bg: string; color: string; dot: string }> = {
      FAIBLE:   { label: 'Faible',   bg: 'rgba(16,185,129,0.12)',  color: '#059669', dot: '#10b981' },
      MOYENNE:  { label: 'Moyenne',  bg: 'rgba(245,158,11,0.12)', color: '#d97706', dot: '#f59e0b' },
      HAUTE:    { label: 'Haute',    bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', dot: '#ef4444' },
      CRITIQUE: { label: 'Critique', bg: 'rgba(236,72,153,0.12)', color: '#e11d48', dot: '#ec4899' }
    };
    return map[this.gravite] || { label: this.gravite, bg: 'rgba(148,163,184,0.12)', color: '#64748b', dot: '#94a3b8' };
  }
}
