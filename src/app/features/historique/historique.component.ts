import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { HistoriqueService } from '../../core/services/historique.service';
import { HistoriqueRetour } from '../../core/models/historique.model';
import { EtatTraitement } from '../../core/models/retour.model';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatChipsModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Historique des Activités</h1>
        <p class="subtitle">Chronologie des changements d'état</p>
      </div>
      <button mat-stroked-button (click)="load()">
        <mat-icon>refresh</mat-icon> Actualiser
      </button>
    </div>

    <div *ngIf="loading()" class="loading-center">
      <mat-spinner></mat-spinner>
    </div>

    <mat-card *ngIf="!loading()">
      <mat-card-content>
        <div *ngIf="filteredItems().length === 0" class="empty-state">
          <mat-icon>history</mat-icon>
          <p>Aucune activité récente</p>
        </div>

        <div class="timeline">
          <div *ngFor="let item of filteredItems()" class="timeline-item">
            <div class="timeline-marker" [style.background-color]="getActionColor(item.nouvelEtat)">
              <mat-icon class="marker-icon">{{ getActionIcon(item.nouvelEtat) }}</mat-icon>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="action-text">{{ item.action }}</span>
                <span class="action-date">{{ formatRelativeDate(item.date) }}</span>
              </div>
              <div class="timeline-details">
                <span class="employee">
                  <mat-icon style="font-size:14px;height:14px;width:14px;vertical-align:middle;">person</mat-icon>
                  {{ item.employeNom || 'Système' }}
                </span>
                <span class="date-exact">{{ item.date | date:'dd/MM/yyyy à HH:mm' }}</span>
              </div>
              <div class="state-transition" *ngIf="item.ancienEtat && item.nouvelEtat">
                <mat-chip style="background:#ffebee;color:#c62828;font-size:11px;height:24px;">{{ item.ancienEtat }}</mat-chip>
                <mat-icon style="font-size:16px;color:#999;">arrow_forward</mat-icon>
                <mat-chip style="background:#e8f5e9;color:#2e7d32;font-size:11px;height:24px;">{{ item.nouvelEtat }}</mat-chip>
              </div>
              <a mat-button color="primary" [routerLink]="['/retours', item.retourId]" style="padding:0;min-width:auto;font-size:12px;">
                Voir retour #{{ item.retourId }} →
              </a>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #ccc; }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; }
    .timeline { position: relative; padding-left: 48px; }
    .timeline::before { content: ''; position: absolute; left: 16px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #3f51b5, #e0e0e0); }
    .timeline-item { position: relative; margin-bottom: 28px; }
    .timeline-marker {
      position: absolute;
      left: -40px;
      top: 2px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .marker-icon { font-size: 16px; height: 16px; width: 16px; color: white; }
    .timeline-content { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; }
    .timeline-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .action-text { font-weight: 600; font-size: 14px; }
    .action-date { font-size: 12px; color: #999; }
    .timeline-details { display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 8px; align-items: center; }
    .state-transition { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  `]
})
export class HistoriqueComponent implements OnInit {
  items = signal<HistoriqueRetour[]>([]);
  filteredItems = signal<HistoriqueRetour[]>([]);
  loading = signal(true);

  constructor(private historiqueService: HistoriqueService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.historiqueService.getRecent().subscribe({
      next: (data) => {
        this.items.set(data);
        this.filteredItems.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getActionColor(etat?: EtatTraitement): string {
    const colors: Record<string, string> = {
      EN_ATTENTE: '#ff9800',
      EN_COURS: '#2196f3',
      VALIDE: '#009688',
      TRAITE: '#4caf50',
      REJETE: '#f44336'
    };
    return etat ? (colors[etat] || '#3f51b5') : '#3f51b5';
  }

  getActionIcon(etat?: EtatTraitement): string {
    const icons: Record<string, string> = {
      EN_ATTENTE: 'hourglass_empty',
      EN_COURS: 'autorenew',
      VALIDE: 'verified',
      TRAITE: 'done_all',
      REJETE: 'cancel'
    };
    return etat ? (icons[etat] || 'history') : 'history';
  }

  formatRelativeDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }
}
