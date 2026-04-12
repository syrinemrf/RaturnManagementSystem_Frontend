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
    <div class="page-header animate-fade-up">
      <div>
        <h1 class="page-title">Historique des Activités</h1>
        <p class="page-subtitle">Chronologie des changements d'état</p>
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
                <span class="state-old">{{ item.ancienEtat }}</span>
                <mat-icon style="font-size:14px;height:14px;width:14px;color:#94a3b8;">arrow_forward</mat-icon>
                <span class="state-new">{{ item.nouvelEtat }}</span>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: var(--text-muted); }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; }
    .timeline { position: relative; padding-left: 52px; }
    .timeline::before { content: ''; position: absolute; left: 18px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, var(--primary) 0%, var(--border) 100%); }
    .timeline-item { position: relative; margin-bottom: 28px; }
    .timeline-marker {
      position: absolute; left: -44px; top: 0;
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    }
    .marker-icon { font-size: 18px; height: 18px; width: 18px; color: white; }
    .timeline-content {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 12px; padding: 14px 16px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.15s ease;
      &:hover { box-shadow: var(--shadow-md); }
    }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
    .action-text { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .action-date { font-size: 11px; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
    .timeline-details { display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; align-items: center; flex-wrap: wrap; }
    .employee { display: flex; align-items: center; gap: 4px; }
    .state-transition { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .state-old { font-size: 11px; background: var(--error-light); color: var(--error); padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    .state-new { font-size: 11px; background: var(--success-light); color: var(--success); padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    a[routerLink] { font-size: 12px; font-weight: 500; }
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
      EN_ATTENTE: '#d97706',
      EN_COURS: '#3b82f6',
      VALIDE: '#059669',
      TRAITE: '#22c55e',
      REJETE: '#dc2626'
    };
    return etat ? (colors[etat] || '#2563eb') : '#2563eb';
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
