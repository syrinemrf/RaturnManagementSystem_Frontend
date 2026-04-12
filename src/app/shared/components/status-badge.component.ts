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
      EN_ATTENTE: { label: 'En Attente', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
      EN_COURS:   { label: 'En Cours',   bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
      VALIDE:     { label: 'Validé',     bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
      TRAITE:     { label: 'Traité',     bg: '#dcfce7', color: '#14532d', dot: '#22c55e' },
      REJETE:     { label: 'Rejeté',     bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' }
    };
    return map[this.etat] || { label: this.etat, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  }
}
