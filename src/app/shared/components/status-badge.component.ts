import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtatTraitement } from '../../core/models/retour.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-pill" [style.background]="getConfig().bg" [style.color]="getConfig().color">
      <span class="dot" [style.background]="getConfig().dot"></span>
      {{ getConfig().label }}
    </span>
  `,
  styles: [`
    .status-pill {
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
export class StatusBadgeComponent {
  @Input() etat!: EtatTraitement;

  getConfig(): { label: string; bg: string; color: string; dot: string } {
    const map: Record<string, { label: string; bg: string; color: string; dot: string }> = {
      EN_ATTENTE: { label: 'En Attente', bg: 'rgba(245,158,11,0.12)', color: '#d97706', dot: '#f59e0b' },
      EN_COURS:   { label: 'En Cours',   bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', dot: '#3b82f6' },
      VALIDE:     { label: 'Valid\u00e9',  bg: 'rgba(16,185,129,0.12)',  color: '#059669', dot: '#10b981' },
      TRAITE:     { label: 'Trait\u00e9',  bg: 'rgba(34,197,94,0.12)',   color: '#059669', dot: '#22c55e' },
      REJETE:     { label: 'Rejet\u00e9',  bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', dot: '#ef4444' }
    };
    return map[this.etat] || { label: this.etat, bg: 'rgba(148,163,184,0.12)', color: '#64748b', dot: '#94a3b8' };
  }
}
