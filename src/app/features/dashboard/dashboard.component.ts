import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatButtonModule, MatDividerModule,
    NgChartsModule, StatusBadgeComponent
  ],
  template: `
    <div class="dash-header animate-fade-up">
      <div>
        <h1 class="page-title">Tableau de Bord</h1>
        <p class="page-subtitle">Vue d'ensemble du système de gestion des retours</p>
      </div>
      <div class="refresh-info" *ngIf="!loading()">
        <mat-icon>autorenew</mat-icon>
        <span>Actualisation auto toutes les minutes</span>
      </div>
    </div>

    <div *ngIf="loading()" class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Chargement des statistiques…</p>
    </div>

    <div *ngIf="!loading() && stats()" class="dashboard-content">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-indigo">
          <div class="kpi-icon-wrap"><mat-icon>assignment_return</mat-icon></div>
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
          <div class="kpi-arrow"><mat-icon>arrow_forward</mat-icon></div>
        </div>

        <div class="kpi-card kpi-emerald">
          <div class="kpi-icon-wrap"><mat-icon>check_circle</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Taux de Résolution</p>
            <p class="kpi-value">{{ stats()!.tauxResolution | number:'1.0-1' }}<small>%</small></p>
          </div>
        </div>

        <div class="kpi-card kpi-rose">
          <div class="kpi-icon-wrap"><mat-icon>report_problem</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Non-Conformités</p>
            <p class="kpi-value">{{ stats()!.totalNonConformites }}</p>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title class="card-title">Répartition par État</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart [data]="doughnutData" [options]="doughnutOptions" type="doughnut"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title class="card-title">Statistiques Détaillées</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart [data]="barData" [options]="barOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-grid">
        <!-- Recent Retours -->
        <mat-card class="recent-card">
          <mat-card-header class="card-header-flex">
            <mat-card-title class="card-title">Derniers Retours</mat-card-title>
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
                <th mat-header-cell *matHeaderCellDef>État</th>
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
                  <a mat-icon-button [routerLink]="['/retours', r.id]" color="primary">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: recentColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Activity Feed -->
        <mat-card class="activity-card">
          <mat-card-header>
            <mat-card-title class="card-title">Activité Récente</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-list">
              <div *ngFor="let item of stats()!.recentActivite; let i = index" class="activity-item" [style.animation-delay]="i * 60 + 'ms'">
                <div class="activity-line"></div>
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <p class="activity-action">{{ item.action }}</p>
                  <div class="activity-meta">
                    <span><mat-icon style="font-size:13px;height:13px;width:13px;vertical-align:middle;">person</mat-icon> {{ item.employeNom || 'Système' }}</span>
                    <span>{{ item.date | date:'dd/MM HH:mm' }}</span>
                  </div>
                  <div class="state-chips" *ngIf="item.ancienEtat && item.nouvelEtat">
                    <span class="state-old">{{ item.ancienEtat }}</span>
                    <mat-icon style="font-size:13px;height:13px;width:13px;color:#94a3b8;">arrow_forward</mat-icon>
                    <span class="state-new">{{ item.nouvelEtat }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="!stats()!.recentActivite?.length" class="empty-act">
                <mat-icon>event_note</mat-icon>
                <p>Aucune activité récente</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    /* Header */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .refresh-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
    .refresh-info mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .loading-container { display: flex; flex-direction: column; align-items: center; padding: 80px; gap: 16px; color: #64748b; }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;
      &:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.15) !important; }
    }
    .kpi-indigo { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; box-shadow: 0 6px 20px rgba(99,102,241,0.3) !important; }
    .kpi-amber  { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; box-shadow: 0 6px 20px rgba(245,158,11,0.3) !important; }
    .kpi-emerald{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; box-shadow: 0 6px 20px rgba(16,185,129,0.3) !important; }
    .kpi-rose   { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: white; box-shadow: 0 6px 20px rgba(244,63,94,0.3) !important; }

    .kpi-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; height: 24px; width: 24px; color: white; }
    }
    .kpi-body { flex: 1; }
    .kpi-label { margin: 0; font-size: 12px; font-weight: 500; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-value { margin: 4px 0 0; font-size: 30px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; small { font-size: 18px; opacity: 0.8; } }
    .kpi-arrow { mat-icon { color: rgba(255,255,255,0.7); } }

    /* Charts */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-card { }
    .chart-content { display: flex; justify-content: center; max-height: 280px; padding: 8px 0; }
    .card-title { font-size: 15px !important; font-weight: 600 !important; color: #0f172a !important; }
    .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
    .view-all-btn { display: flex; align-items: center; gap: 4px; font-size: 13px !important; }
    .view-all-btn mat-icon { font-size: 16px; height: 16px; width: 16px; }

    /* Bottom */
    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .full-width-table { width: 100%; }

    /* Activity */
    .activity-list { max-height: 360px; overflow-y: auto; padding: 4px 0; }
    .activity-item { display: flex; gap: 14px; padding: 10px 0; position: relative; animation: fadeInUp 0.3s ease both; }
    .activity-line { position: absolute; left: 11px; top: 26px; bottom: -10px; width: 2px; background: #f1f5f9; z-index: 0; }
    .activity-dot {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; z-index: 1;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      box-shadow: 0 2px 6px rgba(99,102,241,0.3);
    }
    .activity-content { flex: 1; min-width: 0; }
    .activity-action { margin: 0 0 3px; font-size: 13px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .activity-meta { display: flex; gap: 10px; font-size: 11px; color: #94a3b8; align-items: center; }
    .state-chips { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
    .state-old { font-size: 11px; background: #fee2e2; color: #991b1b; padding: 1px 7px; border-radius: 20px; font-weight: 600; }
    .state-new { font-size: 11px; background: #d1fae5; color: #065f46; padding: 1px 7px; border-radius: 20px; font-weight: 600; }
    .empty-act { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; color: #cbd5e1; mat-icon { font-size: 40px; height: 40px; width: 40px; } p { margin: 8px 0 0; } }

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

  doughnutData: ChartData<'doughnut'> = {
    labels: ['En Attente', 'En Cours', 'Validé', 'Traité', 'Rejeté'],
    datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#ff9800', '#2196f3', '#009688', '#4caf50', '#f44336'] }]
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  barData: ChartData<'bar'> = {
    labels: ['En Attente', 'En Cours', 'Validé', 'Traité', 'Rejeté'],
    datasets: [{ label: 'Retours', data: [0, 0, 0, 0, 0], backgroundColor: ['#ff9800', '#2196f3', '#009688', '#4caf50', '#f44336'] }]
  };

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
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
