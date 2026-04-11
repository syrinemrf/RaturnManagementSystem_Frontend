import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Gravite } from '../../core/models/nonconformite.model';

@Component({
  selector: 'app-gravite-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [style.background-color]="getColor()" style="color: white; font-weight: 500; font-size: 12px;">
      {{ getLabel() }}
    </mat-chip>
  `
})
export class GraviteBadgeComponent {
  @Input() gravite!: Gravite;

  getLabel(): string {
    const labels: Record<string, string> = {
      FAIBLE: 'Faible',
      MOYENNE: 'Moyenne',
      HAUTE: 'Haute',
      CRITIQUE: 'Critique'
    };
    return labels[this.gravite] || this.gravite;
  }

  getColor(): string {
    const colors: Record<string, string> = {
      FAIBLE: '#4caf50',
      MOYENNE: '#ff9800',
      HAUTE: '#f44336',
      CRITIQUE: '#b71c1c'
    };
    return colors[this.gravite] || '#9e9e9e';
  }
}
