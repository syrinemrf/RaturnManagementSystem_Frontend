import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart, ArcElement, Tooltip, Legend, DoughnutController,
  BarController, BarElement, CategoryScale, LinearScale, Title
} from 'chart.js';

import { DashboardService } from '../../core/services/dashboard.service';
import { RetourService } from '../../core/services/retour.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/dashboard.model';
import { RetourProduit, EtatTraitement } from '../../core/models/retour.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Title);

interface Alert {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  message: string;
  link: string;
  linkLabel: string;
}

interface KpiCard {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  bg: string;
  color: string;
  badge?: string | null;
  badgeBg?: string;
  badgeColor?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatButtonModule, MatDividerModule,
    MatTooltipModule, NgChartsModule, StatusBadgeComponent
  ],
  template: `
    <div class="dash-header animate-fade-up">
      <div>
        <h1 class="page-title">Tableau de Bord</h1>
        <p class="page-subtitle">{{ isEmploye ? 'Suivi de vos retours produits' : 'Vue d\\'ensemble du syst\u00e8me de gestion des retours' }}</p>
      </div>
      <div class="header-actions">
        <div class="refresh-info" *ngIf="!loading()">
          <mat-icon>schedule</mat-icon>
          <span>Mise \u00e0 jour auto chaque minute</span>
        </div>
        <button mat-stroked-button (click)="loadData()" *ngIf="!loading()">
          <mat-icon>refresh</mat-icon> Actualiser
        </button>
      </div>
    </div>

    <div *ngIf="loading()" class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Chargement des statistiques\u2026</p>
    </div>

    <div *ngIf="!loading()" class="dashboard-content">

      <!-- Employee Welcome Banner -->
      <div class="welcome-banner animate-fade-up" *ngIf="isEmploye">
        <div class="welcome-icon"><mat-icon>waving_hand</mat-icon></div>
        <div class="welcome-text">
          <h2>Bienvenue, {{ userName }} !</h2>
          <p>Retrouvez ici un aper\u00e7u de vos retours et de leur avancement.</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/retours/nouveau" class="welcome-action">
          <mat-icon>add</mat-icon> Nouveau Retour
        </button>
      </div>

      <!-- Alerts Strip (admin/qualit\u00e9 only) -->
      <div class="alerts-strip animate-fade-up" *ngIf="alerts().length > 0">
        <div *ngFor="let a of alerts(); let i = index"
             class="alert-card"
             [class.alert-danger]="a.type === 'danger'"
             [class.alert-warning]="a.type === 'warning'"
             [class.alert-info]="a.type === 'info'"
             [style.animation-delay]="i * 80 + 'ms'">
          <div class="alert-icon-wrap">
            <mat-icon>{{ a.icon }}</mat-icon>
          </div>
          <span class="alert-message">{{ a.message }}</span>
          <a [routerLink]="a.link" class="alert-link">{{ a.linkLabel }} <mat-icon>arrow_forward</mat-icon></a>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid animate-fade-up">
        <div class="kpi-card" *ngFor="let kpi of kpiCards(); let i = index" [style.animation-delay]="i * 60 + 'ms'">
          <div class="kpi-icon" [style.background]="kpi.bg" [style.color]="kpi.color">
            <mat-icon>{{ kpi.icon }}</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">{{ kpi.label }}</p>
            <p class="kpi-value">{{ kpi.value }}<small *ngIf="kpi.suffix">{{ kpi.suffix }}</small></p>
          </div>
          <div class="kpi-badge" *ngIf="kpi.badge" [style.background]="kpi.badgeBg" [style.color]="kpi.badgeColor">
            {{ kpi.badge }}
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <mat-card class="chart-card animate-fade-up">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">donut_large</mat-icon>
              R\u00e9partition par \u00c9tat
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart [data]="doughnutData" [options]="doughnutOptions" type="doughnut"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card animate-fade-up">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">analytics</mat-icon>
              Analyse par Cause de Retour
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content cause-chart">
            <canvas baseChart [data]="causeData" [options]="causeOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-grid">
        <mat-card class="recent-card animate-fade-up">
          <mat-card-header class="card-header-flex">
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">list_alt</mat-icon>
              {{ isEmploye ? 'Mes Derniers Retours' : 'Derniers Retours' }}
            </mat-card-title>
            <a mat-button color="primary" routerLink="/retours" class="view-all-btn">
              Voir tout <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="recentRetours().length === 0" class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>Aucun retour pour le moment</p>
              <button mat-stroked-button routerLink="/retours/nouveau" *ngIf="isEmploye">
                <mat-icon>add</mat-icon> Cr\u00e9er un retour
              </button>
            </div>
            <table mat-table [dataSource]="recentRetours()" class="full-width-table" *ngIf="recentRetours().length > 0">
              <ng-container matColumnDef="produit">
                <th mat-header-cell *matHeaderCellDef>Produit</th>
                <td mat-cell *matCellDef="let r"><strong>{{ r.produit }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let r">{{ r.client }}</td>
              </ng-container>
              <ng-container matColumnDef="raison">
                <th mat-header-cell *matHeaderCellDef>Raison</th>
                <td mat-cell *matCellDef="let r">
                  <span class="raison-chip">{{ r.raison }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="etat">
                <th mat-header-cell *matHeaderCellDef>\u00c9tat</th>
                <td mat-cell *matCellDef="let r">
                  <app-status-badge [etat]="r.etatTraitement"></app-status-badge>
                </td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let r">{{ r.date | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let r">
                  <a mat-icon-button [routerLink]="['/retours', r.id]" color="primary" matTooltip="Voir d\u00e9tails">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: recentColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="activity-card animate-fade-up" *ngIf="!isEmploye && stats()">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">history</mat-icon>
              Activit\u00e9 R\u00e9cente
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-list">
              <div *ngFor="let item of stats()!.recentActivite; let i = index"
                   class="activity-item"
                   [style.animation-delay]="i * 60 + 'ms'">
                <div class="activity-line"></div>
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <p class="activity-action">{{ item.action }}</p>
                  <div class="activity-meta">
                    <span><mat-icon class="meta-icon">person</mat-icon> {{ item.employeNom || 'Syst\u00e8me' }}</span>
                    <span>{{ item.date | date:'dd/MM HH:mm' }}</span>
                  </div>
                  <div class="state-chips" *ngIf="item.ancienEtat && item.nouvelEtat">
                    <span class="state-old">{{ item.ancienEtat }}</span>
                    <mat-icon class="meta-icon" style="color:var(--text-muted)">arrow_forward</mat-icon>
                    <span class="state-new">{{ item.nouvelEtat }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="!stats()!.recentActivite?.length" class="empty-act">
                <mat-icon>event_note</mat-icon>
                <p>Aucune activit\u00e9 r\u00e9cente</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Employee: Summary instead of activity -->
        <mat-card class="summary-card animate-fade-up" *ngIf="isEmploye">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">pie_chart</mat-icon>
              R\u00e9sum\u00e9
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-list">
              <div class="summary-row" *ngFor="let item of summaryItems()">
                <span class="summary-label">{{ item.label }}</span>
                <span class="summary-value" [style.color]="item.color">{{ item.value }}</span>
              </div>
            </div>
            <div *ngIf="summaryItems().length === 0" class="empty-act">
              <mat-icon>analytics</mat-icon>
              <p>Aucune donn\u00e9e disponible</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .refresh-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
    .refresh-info mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .loading-container { display: flex; flex-direction: column; align-items: center; padding: 80px; gap: 16px; color: var(--text-secondary); }

    /* Welcome Banner */
    .welcome-banner {
      display: flex; align-items: center; gap: 16px; padding: 20px 24px;
      background: linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(20,184,166,0.04) 100%);
      border: 1px solid rgba(13,148,136,0.15); border-radius: var(--radius-lg);
      margin-bottom: 20px;
    }
    .welcome-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(13,148,136,0.12); color: #0d9488;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; height: 24px; width: 24px; }
    }
    .welcome-text { flex: 1; }
    .welcome-text h2 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: var(--text-primary); }
    .welcome-text p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }
    .welcome-action { flex-shrink: 0; }

    /* Alerts */
    .alerts-strip { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .alert-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: var(--radius-lg);
      animation: slideInRight 0.3s ease both;
      border: 1px solid transparent;
    }
    .alert-danger {
      background: var(--error-light); border-color: rgba(var(--error-rgb), 0.2);
      .alert-icon-wrap { background: rgba(var(--error-rgb), 0.15); }
      .alert-icon-wrap mat-icon, .alert-message, .alert-link { color: var(--error); }
    }
    .alert-warning {
      background: var(--warning-light); border-color: rgba(var(--warning-rgb), 0.2);
      .alert-icon-wrap { background: rgba(var(--warning-rgb), 0.15); }
      .alert-icon-wrap mat-icon, .alert-message, .alert-link { color: var(--warning); }
    }
    .alert-info {
      background: var(--info-light); border-color: rgba(var(--info-rgb), 0.2);
      .alert-icon-wrap { background: rgba(var(--info-rgb), 0.15); }
      .alert-icon-wrap mat-icon, .alert-message, .alert-link { color: var(--info); }
    }
    .alert-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }
    .alert-message { flex: 1; font-size: 13px; font-weight: 600; }
    .alert-link {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;
      mat-icon { font-size: 14px; height: 14px; width: 14px; }
    }

    /* KPI Grid — clean flat cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background: var(--surface); border: 1px solid var(--card-border);
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: center; gap: 14px;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      animation: fadeInUp 0.35s ease both;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; height: 24px; width: 24px; }
    }
    .kpi-body { flex: 1; min-width: 0; }
    .kpi-label { margin: 0; font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value {
      margin: 4px 0 0; font-size: 28px; font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-primary); line-height: 1;
      small { font-size: 16px; color: var(--text-muted); }
    }
    .kpi-badge {
      position: absolute; top: 14px; right: 14px;
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
    }

    /* Charts */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-content { display: flex; justify-content: center; max-height: 280px; padding: 8px 0; }
    .cause-chart { max-height: 320px; }
    .card-title {
      font-size: 15px !important; font-weight: 600 !important; color: var(--text-primary) !important;
      display: flex !important; align-items: center; gap: 8px;
    }
    .card-title-icon { font-size: 18px; height: 18px; width: 18px; color: var(--primary); }
    .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
    .view-all-btn { display: flex; align-items: center; gap: 4px; font-size: 13px !important; }
    .view-all-btn mat-icon { font-size: 16px; height: 16px; width: 16px; }

    /* Raison chip */
    .raison-chip {
      font-size: 11px; font-weight: 600; padding: 2px 8px;
      border-radius: 20px; background: rgba(13,148,136,0.1); color: #0d9488;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 160px; display: inline-block;
    }

    /* Bottom Row */
    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .full-width-table { width: 100%; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--text-muted); gap: 12px;
      mat-icon { font-size: 48px; height: 48px; width: 48px; }
      p { margin: 0; font-size: 14px; }
    }

    /* Activity */
    .activity-list { max-height: 360px; overflow-y: auto; padding: 4px 0; }
    .activity-item { display: flex; gap: 14px; padding: 10px 0; position: relative; animation: fadeInUp 0.3s ease both; }
    .activity-line { position: absolute; left: 11px; top: 26px; bottom: -10px; width: 2px; background: var(--border); z-index: 0; }
    .activity-dot {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; z-index: 1;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      box-shadow: 0 2px 6px rgba(var(--primary-rgb), 0.3);
    }
    .activity-content { flex: 1; min-width: 0; }
    .activity-action { margin: 0 0 3px; font-size: 13px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .activity-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); align-items: center; }
    .meta-icon { font-size: 13px; height: 13px; width: 13px; vertical-align: middle; }
    .state-chips { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
    .state-old { font-size: 11px; background: var(--error-light); color: var(--error); padding: 1px 7px; border-radius: 20px; font-weight: 600; }
    .state-new { font-size: 11px; background: var(--success-light); color: var(--success); padding: 1px 7px; border-radius: 20px; font-weight: 600; }
    .empty-act { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; color: var(--text-muted); mat-icon { font-size: 40px; height: 40px; width: 40px; } p { margin: 8px 0 0; } }

    /* Summary card (employee) */
    .summary-list { display: flex; flex-direction: column; }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .summary-label { font-size: 13px; color: var(--text-secondary); }
    .summary-value { font-size: 18px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }

    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
      .welcome-banner { flex-direction: column; text-align: center; }
    }
    @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<DashboardStats | null>(null);
  allRetours = signal<RetourProduit[]>([]);
  loading = signal(true);
  isEmploye = false;
  userName = '';
  recentColumns = ['produit', 'client', 'raison', 'etat', 'date', 'actions'];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  recentRetours = computed(() => {
    const s = this.stats();
    if (s?.recentRetours?.length) return s.recentRetours.slice(0, 8);
    return this.allRetours().slice(0, 8);
  });

  alerts = computed<Alert[]>(() => {
    const s = this.stats();
    if (!s || this.isEmploye) return [];
    const list: Alert[] = [];
    if (s.nonConformitesCritiques > 0) {
      list.push({ type: 'danger', icon: 'error', message: s.nonConformitesCritiques + ' non-conformit\u00e9(s) critique(s) n\u00e9cessitent une attention imm\u00e9diate', link: '/non-conformites', linkLabel: 'Voir les NC' });
    }
    if (s.nonConformitesHautes > 0) {
      list.push({ type: 'warning', icon: 'warning', message: s.nonConformitesHautes + ' non-conformit\u00e9(s) de gravit\u00e9 haute en cours', link: '/non-conformites', linkLabel: 'G\u00e9rer' });
    }
    if (s.retoursEnAttente > 3) {
      list.push({ type: 'info', icon: 'pending_actions', message: s.retoursEnAttente + ' retour(s) en attente de traitement', link: '/retours', linkLabel: 'Traiter' });
    }
    return list;
  });

  kpiCards = computed<KpiCard[]>(() => {
    const s = this.stats();
    const retours = this.allRetours();

    if (this.isEmploye) {
      const total = retours.length;
      const enAttente = retours.filter(r => r.etatTraitement === EtatTraitement.EN_ATTENTE).length;
      const enCours = retours.filter(r => r.etatTraitement === EtatTraitement.EN_COURS).length;
      const traites = retours.filter(r => r.etatTraitement === EtatTraitement.TRAITE).length;
      return [
        { icon: 'assignment', label: 'Mes Retours', value: total, bg: 'rgba(13,148,136,0.1)', color: '#0d9488' },
        { icon: 'hourglass_empty', label: 'En Attente', value: enAttente, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', badge: enAttente > 0 ? '\u00c0 traiter' : null, badgeBg: 'rgba(245,158,11,0.1)', badgeColor: '#f59e0b' },
        { icon: 'autorenew', label: 'En Cours', value: enCours, bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
        { icon: 'check_circle', label: 'Trait\u00e9s', value: traites, bg: 'rgba(34,197,94,0.1)', color: '#22c55e' }
      ];
    }

    if (!s) return [];
    return [
      { icon: 'assignment', label: 'Total Retours', value: s.totalRetours, bg: 'rgba(13,148,136,0.1)', color: '#0d9488' },
      { icon: 'hourglass_empty', label: 'En Attente', value: s.retoursEnAttente, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', badge: s.retoursEnAttente > 0 ? '\u00c0 traiter' : null, badgeBg: 'rgba(245,158,11,0.1)', badgeColor: '#f59e0b' },
      { icon: 'check_circle', label: 'Taux de R\u00e9solution', value: Math.round(s.tauxResolution * 10) / 10, suffix: '%', bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      { icon: 'report_problem', label: 'Non-Conformit\u00e9s', value: s.totalNonConformites, bg: 'rgba(239,68,68,0.1)', color: '#ef4444', badge: s.nonConformitesCritiques > 0 ? s.nonConformitesCritiques + ' critiques' : null, badgeBg: 'rgba(239,68,68,0.1)', badgeColor: '#ef4444' }
    ];
  });

  summaryItems = computed(() => {
    const retours = this.allRetours();
    if (retours.length === 0) return [];
    return [
      { label: 'En Attente', value: retours.filter(r => r.etatTraitement === EtatTraitement.EN_ATTENTE).length, color: '#f59e0b' },
      { label: 'En Cours', value: retours.filter(r => r.etatTraitement === EtatTraitement.EN_COURS).length, color: '#3b82f6' },
      { label: 'Valid\u00e9s', value: retours.filter(r => r.etatTraitement === EtatTraitement.VALIDE).length, color: '#0d9488' },
      { label: 'Trait\u00e9s', value: retours.filter(r => r.etatTraitement === EtatTraitement.TRAITE).length, color: '#22c55e' },
      { label: 'Rejet\u00e9s', value: retours.filter(r => r.etatTraitement === EtatTraitement.REJETE).length, color: '#ef4444' }
    ];
  });

  // Charts
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 6 }] };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } } }
  };

  causeData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Retours', data: [], backgroundColor: [], borderRadius: 6, borderSkipped: false }] };
  causeOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private retourService: RetourService,
    private authService: AuthService
  ) {
    this.isEmploye = !this.authService.isQualite();
    this.userName = this.authService.getCurrentUser()?.nom || '';
  }

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadData(): void {
    this.loading.set(true);
    if (this.isEmploye) {
      this.retourService.getAll().subscribe({
        next: (retours) => {
          this.allRetours.set(retours);
          this.updateDoughnutFromRetours(retours);
          this.updateCauseChart(retours);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.dashboardService.getStats().subscribe({
        next: (data) => {
          this.stats.set(data);
          this.updateDoughnutFromStats(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
      this.retourService.getAll().subscribe({
        next: (retours) => {
          this.allRetours.set(retours);
          this.updateCauseChart(retours);
        },
        error: () => {}
      });
    }
  }

  updateDoughnutFromStats(data: DashboardStats): void {
    const colors = ['#f59e0b', '#3b82f6', '#0d9488', '#22c55e', '#ef4444'];
    this.doughnutData = {
      labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
      datasets: [{ data: [data.retoursEnAttente, data.retoursEnCours, data.retoursValides, data.retoursTraites, data.retoursRejetes], backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
    };
  }

  updateDoughnutFromRetours(retours: RetourProduit[]): void {
    const colors = ['#f59e0b', '#3b82f6', '#0d9488', '#22c55e', '#ef4444'];
    const counts = [
      retours.filter(r => r.etatTraitement === EtatTraitement.EN_ATTENTE).length,
      retours.filter(r => r.etatTraitement === EtatTraitement.EN_COURS).length,
      retours.filter(r => r.etatTraitement === EtatTraitement.VALIDE).length,
      retours.filter(r => r.etatTraitement === EtatTraitement.TRAITE).length,
      retours.filter(r => r.etatTraitement === EtatTraitement.REJETE).length
    ];
    this.doughnutData = {
      labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
      datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
    };
  }

  updateCauseChart(retours: RetourProduit[]): void {
    const causeCounts: Record<string, number> = {};
    retours.forEach(r => {
      const raison = r.raison || 'Non sp\u00e9cifi\u00e9';
      causeCounts[raison] = (causeCounts[raison] || 0) + 1;
    });
    const sorted = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.map(([label]) => label.length > 28 ? label.substring(0, 28) + '\u2026' : label);
    const data = sorted.map(([, count]) => count);
    const shades = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#0f766e', '#115e59', '#134e4a'];
    const colors = sorted.map((_, i) => shades[i % shades.length]);
    this.causeData = {
      labels,
      datasets: [{ label: 'Retours', data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }]
    };
  }
}
