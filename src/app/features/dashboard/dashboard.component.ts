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
import { DashboardStats } from '../../core/models/dashboard.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EtatTraitement } from '../../core/models/retour.model';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Title);

interface Alert {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  message: string;
  link: string;
  linkLabel: string;
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
        <p class="page-subtitle">Vue d'ensemble du syst&#232;me de gestion des retours</p>
      </div>
      <div class="header-actions">
        <div class="refresh-info" *ngIf="!loading()">
          <mat-icon>schedule</mat-icon>
          <span>Mise &#224; jour auto chaque minute</span>
        </div>
        <button mat-stroked-button (click)="loadStats()" *ngIf="!loading()">
          <mat-icon>refresh</mat-icon> Actualiser
        </button>
      </div>
    </div>

    <div *ngIf="loading()" class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Chargement des statistiques&#8230;</p>
    </div>

    <div *ngIf="!loading() && stats()" class="dashboard-content">

      <!-- Alerts Strip -->
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
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon-wrap"><mat-icon>assignment</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Total Retours</p>
            <p class="kpi-value">{{ stats()!.totalRetours }}</p>
          </div>
        </div>

        <div class="kpi-card kpi-amber" style="cursor:pointer" routerLink="/retours">
          <div class="kpi-icon-wrap"><mat-icon>hourglass_empty</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">En Attente</p>
            <p class="kpi-value">{{ stats()!.retoursEnAttente }}</p>
          </div>
          <div class="kpi-trend" *ngIf="stats()!.retoursEnAttente > 0">
            <mat-icon>trending_up</mat-icon>
          </div>
        </div>

        <div class="kpi-card kpi-cyan">
          <div class="kpi-icon-wrap"><mat-icon>autorenew</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">En Cours</p>
            <p class="kpi-value">{{ stats()!.retoursEnCours }}</p>
          </div>
        </div>

        <div class="kpi-card kpi-emerald">
          <div class="kpi-icon-wrap"><mat-icon>check_circle</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Taux de R&#233;solution</p>
            <p class="kpi-value">{{ stats()!.tauxResolution | number:'1.0-1' }}<small>%</small></p>
          </div>
          <div class="kpi-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="stats()!.tauxResolution"></div>
            </div>
          </div>
        </div>

        <div class="kpi-card kpi-rose" style="cursor:pointer" routerLink="/non-conformites">
          <div class="kpi-icon-wrap"><mat-icon>report_problem</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Non-Conformit&#233;s</p>
            <p class="kpi-value">{{ stats()!.totalNonConformites }}</p>
          </div>
          <div class="kpi-sub" *ngIf="stats()!.nonConformitesCritiques > 0">
            <span class="kpi-critical-badge">{{ stats()!.nonConformitesCritiques }} critiques</span>
          </div>
        </div>

        <div class="kpi-card kpi-violet">
          <div class="kpi-icon-wrap"><mat-icon>done_all</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Trait&#233;s</p>
            <p class="kpi-value">{{ stats()!.retoursTraites }}</p>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">donut_large</mat-icon>
              R&#233;partition par &#201;tat
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart [data]="doughnutData" [options]="doughnutOptions" type="doughnut"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">bar_chart</mat-icon>
              Statistiques D&#233;taill&#233;es
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart [data]="barData" [options]="barOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-grid">
        <mat-card class="recent-card">
          <mat-card-header class="card-header-flex">
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">list_alt</mat-icon>
              Derniers Retours
            </mat-card-title>
            <a mat-button color="primary" routerLink="/retours" class="view-all-btn">
              Voir tout <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="stats()!.recentRetours" class="full-width-table">
              <ng-container matColumnDef="produit">
                <th mat-header-cell *matHeaderCellDef>Produit</th>
                <td mat-cell *matCellDef="let r"><strong>{{ r.produit }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let r">{{ r.client }}</td>
              </ng-container>
              <ng-container matColumnDef="etat">
                <th mat-header-cell *matHeaderCellDef>&#201;tat</th>
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
                  <a mat-icon-button [routerLink]="['/retours', r.id]" color="primary" matTooltip="Voir d&#233;tails">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: recentColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="activity-card">
          <mat-card-header>
            <mat-card-title class="card-title">
              <mat-icon class="card-title-icon">history</mat-icon>
              Activit&#233; R&#233;cente
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
                <p>Aucune activit&#233; r&#233;cente</p>
              </div>
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
      .alert-icon-wrap mat-icon { color: var(--error); }
      .alert-message { color: var(--error); }
      .alert-link { color: var(--error); }
    }
    .alert-warning {
      background: var(--warning-light); border-color: rgba(var(--warning-rgb), 0.2);
      .alert-icon-wrap { background: rgba(var(--warning-rgb), 0.15); }
      .alert-icon-wrap mat-icon { color: var(--warning); }
      .alert-message { color: var(--warning); }
      .alert-link { color: var(--warning); }
    }
    .alert-info {
      background: var(--info-light); border-color: rgba(var(--info-rgb), 0.2);
      .alert-icon-wrap { background: rgba(var(--info-rgb), 0.15); }
      .alert-icon-wrap mat-icon { color: var(--info); }
      .alert-message { color: var(--info); }
      .alert-link { color: var(--info); }
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

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: flex-start; gap: 14px;
      position: relative; overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default; color: white;
      &:hover { transform: translateY(-3px); }
    }
    .kpi-blue    { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 6px 20px rgba(37,99,235,0.3); }
    .kpi-amber   { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); box-shadow: 0 6px 20px rgba(217,119,6,0.3); }
    .kpi-cyan    { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); box-shadow: 0 6px 20px rgba(8,145,178,0.3); }
    .kpi-emerald { background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 6px 20px rgba(5,150,105,0.3); }
    .kpi-rose    { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); box-shadow: 0 6px 20px rgba(225,29,72,0.3); }
    .kpi-violet  { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); box-shadow: 0 6px 20px rgba(124,58,237,0.3); }

    .kpi-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 22px; height: 22px; width: 22px; color: white; }
    }
    .kpi-body { flex: 1; min-width: 0; }
    .kpi-label { margin: 0; font-size: 11px; font-weight: 500; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-value { margin: 4px 0 0; font-size: 28px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1; small { font-size: 16px; opacity: 0.8; } }
    .kpi-trend { position: absolute; top: 16px; right: 16px; opacity: 0.6; mat-icon { font-size: 20px; height: 20px; width: 20px; } }
    .kpi-progress { position: absolute; bottom: 0; left: 0; right: 0; padding: 0 20px 12px; }
    .progress-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.2); }
    .progress-fill { height: 100%; border-radius: 2px; background: rgba(255,255,255,0.7); transition: width 1s ease; }
    .kpi-sub { position: absolute; top: 16px; right: 16px; }
    .kpi-critical-badge { font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 20px; animation: pulse-ring 2s infinite; }

    /* Charts */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-content { display: flex; justify-content: center; max-height: 280px; padding: 8px 0; }
    .card-title {
      font-size: 15px !important; font-weight: 600 !important; color: var(--text-primary) !important;
      display: flex !important; align-items: center; gap: 8px;
    }
    .card-title-icon { font-size: 18px; height: 18px; width: 18px; color: var(--primary); }
    .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
    .view-all-btn { display: flex; align-items: center; gap: 4px; font-size: 13px !important; }
    .view-all-btn mat-icon { font-size: 16px; height: 16px; width: 16px; }

    /* Bottom Row */
    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .full-width-table { width: 100%; }

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

    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  recentColumns = ['produit', 'client', 'etat', 'date', 'actions'];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  alerts = computed<Alert[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const list: Alert[] = [];
    if (s.nonConformitesCritiques > 0) {
      list.push({
        type: 'danger', icon: 'error',
        message: s.nonConformitesCritiques + ' non-conformit\u00e9(s) critique(s) n\u00e9cessitent une attention imm\u00e9diate',
        link: '/non-conformites', linkLabel: 'Voir les NC'
      });
    }
    if (s.nonConformitesHautes > 0) {
      list.push({
        type: 'warning', icon: 'warning',
        message: s.nonConformitesHautes + ' non-conformit\u00e9(s) de gravit\u00e9 haute en cours',
        link: '/non-conformites', linkLabel: 'G\u00e9rer'
      });
    }
    if (s.retoursEnAttente > 3) {
      list.push({
        type: 'info', icon: 'pending_actions',
        message: s.retoursEnAttente + ' retour(s) en attente de traitement',
        link: '/retours', linkLabel: 'Traiter'
      });
    }
    return list;
  });

  doughnutData: ChartData<'doughnut'> = {
    labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#d97706', '#0891b2', '#059669', '#2563eb', '#dc2626'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } }
    }
  };

  barData: ChartData<'bar'> = {
    labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
    datasets: [{
      label: 'Retours',
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['rgba(217,119,6,0.8)', 'rgba(8,145,178,0.8)', 'rgba(5,150,105,0.8)', 'rgba(37,99,235,0.8)', 'rgba(220,38,38,0.8)'],
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
    this.refreshInterval = setInterval(() => this.loadStats(), 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.updateCharts(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateCharts(data: DashboardStats): void {
    const values = [data.retoursEnAttente, data.retoursEnCours, data.retoursValides, data.retoursTraites, data.retoursRejetes];
    this.doughnutData = { ...this.doughnutData, datasets: [{ ...this.doughnutData.datasets[0], data: values }] };
    this.barData = { ...this.barData, datasets: [{ ...this.barData.datasets[0], data: values }] };
  }
}
