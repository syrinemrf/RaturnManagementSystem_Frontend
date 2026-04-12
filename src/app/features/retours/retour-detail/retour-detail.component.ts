import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RetourService } from '../../../core/services/retour.service';
import { NonConformiteService } from '../../../core/services/nonconformite.service';
import { HistoriqueService } from '../../../core/services/historique.service';
import { AuthService } from '../../../core/services/auth.service';
import { RetourProduit } from '../../../core/models/retour.model';
import { NonConformite } from '../../../core/models/nonconformite.model';
import { HistoriqueRetour } from '../../../core/models/historique.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { GraviteBadgeComponent } from '../../../shared/components/gravite-badge.component';

@Component({
  selector: 'app-retour-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule,
    StatusBadgeComponent, GraviteBadgeComponent
  ],
  template: `
    <div *ngIf="loading()" class="loading-center">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!loading() && retour()">
      <div class="detail-header">
        <button mat-icon-button routerLink="/retours" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-title">
          <h1>Retour #{{ retour()!.id }} — {{ retour()!.produit }}</h1>
          <app-status-badge [etat]="retour()!.etatTraitement"></app-status-badge>
        </div>
        <button mat-raised-button color="primary" [routerLink]="['/retours', retour()!.id]" *ngIf="authService.isQualite()">
          <mat-icon>edit</mat-icon> Modifier
        </button>
      </div>

      <!-- Info Card -->
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title class="section-title">Informations Générales</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <label>Produit</label>
              <span>{{ retour()!.produit }}</span>
            </div>
            <div class="info-item">
              <label>Client</label>
              <span>{{ retour()!.client }}</span>
            </div>
            <div class="info-item">
              <label>Raison</label>
              <span>{{ retour()!.raison }}</span>
            </div>
            <div class="info-item">
              <label>État</label>
              <app-status-badge [etat]="retour()!.etatTraitement"></app-status-badge>
            </div>
            <div class="info-item">
              <label>Date de création</label>
              <span>{{ retour()!.date | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item">
              <label>Dernière modification</label>
              <span>{{ (retour()!.updatedAt | date:'dd/MM/yyyy HH:mm') || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Créé par</label>
              <span>{{ retour()!.utilisateurNom || 'N/A' }}</span>
            </div>
            <div class="info-item full-col" *ngIf="retour()!.description">
              <label>Description</label>
              <span>{{ retour()!.description }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Non-Conformités Section -->
      <mat-card class="nc-card">
        <mat-card-header>
          <mat-card-title>Non-Conformités ({{ nonConformites().length }})</mat-card-title>
          <button mat-button color="primary" routerLink="/non-conformites" *ngIf="authService.isQualite()">
            <mat-icon>add</mat-icon> Ajouter NC
          </button>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="nonConformites().length === 0" class="empty-msg">
            <mat-icon>check_circle_outline</mat-icon>
            <p>Aucune non-conformité pour ce retour</p>
          </div>
          <div *ngFor="let nc of nonConformites()" class="nc-item">
            <div class="nc-header">
              <span class="nc-produit">{{ nc.produit }}</span>
              <app-gravite-badge [gravite]="nc.gravite"></app-gravite-badge>
            </div>
            <p class="nc-description">{{ nc.description }}</p>
            <p class="nc-date">{{ nc.date | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Historique Timeline -->
      <mat-card class="historique-card">
        <mat-card-header>
          <mat-card-title>Historique des Changements</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="historique().length === 0" class="empty-msg">
            <mat-icon>history</mat-icon>
            <p>Aucun historique disponible</p>
          </div>
          <div class="timeline">
            <div *ngFor="let h of historique()" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <p class="timeline-action">{{ h.action }}</p>
                <p class="timeline-meta">
                  <span><mat-icon style="font-size:14px;height:14px;width:14px;">person</mat-icon> {{ h.employeNom || 'Système' }}</span>
                  <span><mat-icon style="font-size:14px;height:14px;width:14px;">schedule</mat-icon> {{ h.date | date:'dd/MM/yyyy HH:mm' }}</span>
                </p>
                <p class="timeline-states" *ngIf="h.ancienEtat && h.nouvelEtat">
                  <span class="old-state">{{ h.ancienEtat }}</span>
                  <mat-icon style="font-size:16px">arrow_forward</mat-icon>
                  <span class="new-state">{{ h.nouvelEtat }}</span>
                </p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .detail-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
    .back-btn { flex-shrink: 0; color: #64748b !important; }
    .header-title { display: flex; align-items: center; gap: 12px; flex: 1; flex-wrap: wrap; }
    .header-title h1 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; }
    .info-card, .nc-card, .historique-card { margin-bottom: 16px; }
    .section-title { font-size: 14px !important; font-weight: 700 !important; color: #0f172a !important; text-transform: uppercase; letter-spacing: 0.06em !important; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 8px 0; }
    .info-item { display: flex; flex-direction: column; gap: 5px; }
    .info-item label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .info-item span { font-size: 14px; color: #0f172a; font-weight: 500; }
    .full-col { grid-column: 1 / -1; }
    .nc-card-header { display: flex; justify-content: space-between; align-items: center; }
    .nc-item {
      border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px;
      transition: box-shadow 0.15s ease;
      &:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
    }
    .nc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .nc-produit { font-weight: 700; font-size: 14px; color: #0f172a; }
    .nc-description { margin: 4px 0; color: #475569; font-size: 13px; }
    .nc-date { margin: 0; font-size: 11px; color: #94a3b8; }
    .empty-msg { display: flex; flex-direction: column; align-items: center; padding: 32px; color: #cbd5e1; }
    .empty-msg mat-icon { font-size: 48px; height: 48px; width: 48px; }
    .timeline { position: relative; padding-left: 28px; }
    .timeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, var(--primary) 0%, #e2e8f0 100%); }
    .timeline-item { position: relative; margin-bottom: 24px; }
    .timeline-dot {
      position: absolute; left: -22px; top: 3px;
      width: 14px; height: 14px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      border: 2px solid white; box-shadow: 0 0 0 2px #e0e7ff;
    }
    .timeline-action { margin: 0; font-weight: 600; font-size: 14px; color: #0f172a; }
    .timeline-meta { display: flex; gap: 16px; margin: 4px 0 0; font-size: 12px; color: #94a3b8; align-items: center; }
    .timeline-meta span { display: flex; align-items: center; gap: 4px; }
    .timeline-states { display: flex; align-items: center; gap: 8px; margin: 6px 0 0; }
    .old-state { font-size: 11px; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    .new-state { font-size: 11px; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
  `]
})
export class RetourDetailComponent implements OnInit {
  retour = signal<RetourProduit | null>(null);
  nonConformites = signal<NonConformite[]>([]);
  historique = signal<HistoriqueRetour[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private retourService: RetourService,
    private ncService: NonConformiteService,
    private historiqueService: HistoriqueService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.retourService.getById(id).subscribe({
      next: (r) => {
        this.retour.set(r);
        this.loading.set(false);
        this.ncService.getByRetourId(id).subscribe(nc => this.nonConformites.set(nc));
        this.historiqueService.getByRetourId(id).subscribe(h => this.historique.set(h));
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/retours']);
      }
    });
  }
}
