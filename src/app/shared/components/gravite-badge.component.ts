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
      FAIBLE:   { label: 'Faible',   bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
      MOYENNE:  { label: 'Moyenne',  bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
      HAUTE:    { label: 'Haute',    bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
      CRITIQUE: { label: 'Critique', bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' }
    };
    return map[this.gravite] || { label: this.gravite, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  }
}
