import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
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
    BaseChartDirective, StatusBadgeComponent
  ],
  template: `
    <div class="dashboard-header">
      <h1>Tableau de Bord</h1>
      <p class="subtitle">Vue d'ensemble du système de gestion des retours</p>
    </div>

    <div *ngIf="loading()" class="loading-container">
      <mat-spinner></mat-spinner>
      <p>Chargement des statistiques...</p>
    </div>

    <div *ngIf="!loading() && stats()" class="dashboard-content">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card kpi-blue">
          <mat-card-content>
            <div class="kpi-inner">
              <div>
                <p class="kpi-label">Total Retours</p>
                <p class="kpi-value">{{ stats()!.totalRetours }}</p>
              </div>
              <mat-icon class="kpi-icon">assignment_return</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-orange" style="cursor:pointer" routerLink="/retours">
          <mat-card-content>
            <div class="kpi-inner">
              <div>
                <p class="kpi-label">En Attente</p>
                <p class="kpi-value">{{ stats()!.retoursEnAttente }}</p>
              </div>
              <mat-icon class="kpi-icon">hourglass_empty</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-green">
          <mat-card-content>
            <div class="kpi-inner">
              <div>
                <p class="kpi-label">Taux de Résolution</p>
                <p class="kpi-value">{{ stats()!.tauxResolution | number:'1.0-1' }}%</p>
              </div>
              <mat-icon class="kpi-icon">check_circle</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card kpi-red">
          <mat-card-content>
            <div class="kpi-inner">
              <div>
                <p class="kpi-label">Non-Conformités</p>
                <p class="kpi-value">{{ stats()!.totalNonConformites }}</p>
              </div>
              <mat-icon class="kpi-icon">warning</mat-icon>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Répartition par État</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart
              [data]="doughnutData"
              [options]="doughnutOptions"
              type="doughnut">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Statistiques Détaillées</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas baseChart
              [data]="barData"
              [options]="barOptions"
              type="bar">
            </canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-grid">
        <!-- Recent Retours Table -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-card-title>Derniers Retours</mat-card-title>
            <button mat-button color="primary" routerLink="/retours">Voir tout →</button>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="stats()!.recentRetours" class="full-width-table">
              <ng-container matColumnDef="produit">
                <th mat-header-cell *matHeaderCellDef>Produit</th>
                <td mat-cell *matCellDef="let r">{{ r.produit }}</td>
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
            <mat-card-title>Activité Récente</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-list">
              <div *ngFor="let item of stats()!.recentActivite" class="activity-item">
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <p class="activity-action">{{ item.action }}</p>
                  <p class="activity-meta">
                    <span>{{ item.employeNom || 'Système' }}</span>
                    <span>{{ item.date | date:'dd/MM HH:mm' }}</span>
                  </p>
                  <p class="activity-states" *ngIf="item.ancienEtat && item.nouvelEtat">
                    {{ item.ancienEtat }} → {{ item.nouvelEtat }}
                  </p>
                </div>
              </div>
              <p *ngIf="!stats()!.recentActivite?.length" class="empty-msg">Aucune activité récente</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-container { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { border-radius: 12px !important; }
    .kpi-inner { display: flex; justify-content: space-between; align-items: center; }
    .kpi-label { margin: 0; font-size: 13px; opacity: 0.85; font-weight: 500; }
    .kpi-value { margin: 4px 0 0; font-size: 32px; font-weight: 700; }
    .kpi-icon { font-size: 48px; height: 48px; width: 48px; opacity: 0.3; }
    .kpi-blue { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; }
    .kpi-orange { background: linear-gradient(135deg, #f57c00, #ffb74d); color: white; }
    .kpi-green { background: linear-gradient(135deg, #388e3c, #66bb6a); color: white; }
    .kpi-red { background: linear-gradient(135deg, #d32f2f, #ef5350); color: white; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-card { border-radius: 12px !important; }
    .chart-content { display: flex; justify-content: center; max-height: 280px; }
    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .recent-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .full-width-table { width: 100%; }
    .activity-list { max-height: 350px; overflow-y: auto; }
    .activity-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .activity-dot { width: 10px; height: 10px; border-radius: 50%; background: #3f51b5; flex-shrink: 0; margin-top: 5px; }
    .activity-content { flex: 1; }
    .activity-action { margin: 0; font-size: 13px; font-weight: 500; }
    .activity-meta { margin: 2px 0 0; font-size: 11px; color: #999; display: flex; gap: 12px; }
    .activity-states { margin: 2px 0 0; font-size: 11px; color: #3f51b5; font-family: monospace; }
    .empty-msg { color: #999; text-align: center; padding: 16px; }
    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
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
