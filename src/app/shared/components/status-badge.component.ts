import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { EtatTraitement } from '../../core/models/retour.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [ngClass]="getClass()" [style.background-color]="getColor()" style="color: white; font-weight: 500; font-size: 12px;">
      {{ getLabel() }}
    </mat-chip>
  `
})
export class StatusBadgeComponent {
  @Input() etat!: EtatTraitement;

  getLabel(): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En Attente',
      EN_COURS: 'En Cours',
      VALIDE: 'Validé',
      TRAITE: 'Traité',
      REJETE: 'Rejeté'
    };
    return labels[this.etat] || this.etat;
  }

  getColor(): string {
    const colors: Record<string, string> = {
      EN_ATTENTE: '#ff9800',
      EN_COURS: '#2196f3',
      VALIDE: '#009688',
      TRAITE: '#4caf50',
      REJETE: '#f44336'
    };
    return colors[this.etat] || '#9e9e9e';
  }

  getClass(): string {
    return `status-${this.etat?.toLowerCase()?.replace('_', '-')}`;
  }
}
