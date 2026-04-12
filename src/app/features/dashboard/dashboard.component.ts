import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Chart, ArcElement, Tooltip, Legend, DoughnutController,
  BarController, BarElement, CategoryScale, LinearScale, Title
} from 'chart.js';

import { DashboardService } from '../../core/services/dashboard.service';
import { RetourService } from '../../core/services/retour.service';
import { NonConformiteService } from '../../core/services/nonconformite.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/dashboard.model';
import { RetourProduit, EtatTraitement } from '../../core/models/retour.model';
import { NonConformite } from '../../core/models/nonconformite.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Title);

interface KpiCard {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  accent: 'teal' | 'amber' | 'green' | 'red' | 'blue';
  badge?: string | null;
}

interface Alert {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  message: string;
  link: string;
}

interface ProductIssue {
  name: string;
  defauts: number;
  nc: number;
  total: number;
  pct: number;
  gravites: { critique: number; haute: number; moyenne: number; faible: number };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatIconModule, MatTableModule,
    MatButtonModule, MatTooltipModule,
    NgChartsModule, StatusBadgeComponent
  ],
  template: `
    <div class="hd">
      <div>
        <h1 class="page-title">Tableau de Bord</h1>
        <p class="page-subtitle">
          {{ isEmploye ? 'Bonjour\u00a0' + userName + '\u00a0\u2014 suivi de vos retours' : 'Pilotage qualit\u00e9 \u00b7 ' + (today | date:'d MMM yyyy') }}
        </p>
      </div>
      <button mat-stroked-button (click)="loadData()" [disabled]="loading()">
        <mat-icon [style.animation]="loading() ? 'spin 1s linear infinite' : ''">refresh</mat-icon>
        Actualiser
      </button>
    </div>

    <!-- Skeleton while loading -->
    <div class="sk-grid" *ngIf="loading()">
      <div class="sk-kpi" *ngFor="let _ of [1,2,3,4]">
        <div class="sk sk-n"></div><div class="sk sk-l"></div>
      </div>
      <div class="sk-chart"></div>
      <div class="sk-chart"></div>
      <div class="sk-wide"></div>
    </div>

    <div *ngIf="!loading()" class="body">

      <!-- KPI Strip -->
      <div class="kpi-row">
        <div class="kpi" *ngFor="let k of kpiCards()" [class]="'kpi kpi-' + k.accent">
          <div class="kpi-top">
            <mat-icon class="ki">{{ k.icon }}</mat-icon>
            <span class="kpi-badge badge-{{ k.accent }}" *ngIf="k.badge">{{ k.badge }}</span>
          </div>
          <p class="kpi-v">{{ k.value }}<small *ngIf="k.suffix">{{ k.suffix }}</small></p>
          <p class="kpi-l">{{ k.label }}</p>
        </div>
      </div>

      <!-- Alert pills (admin only, critical signals only) -->
      <div class="alerts" *ngIf="alerts().length > 0">
        <a *ngFor="let a of alerts()" [routerLink]="a.link" class="a-pill a-{{ a.type }}">
          <mat-icon>{{ a.icon }}</mat-icon>
          <span>{{ a.message }}</span>
          <mat-icon>arrow_forward</mat-icon>
        </a>
      </div>

      <!-- Charts row -->
      <div class="charts">
        <mat-card class="cc">
          <p class="st"><mat-icon>donut_large</mat-icon> R\u00e9partition par \u00e9tat</p>
          <div class="dw">
            <canvas baseChart [data]="doughnutData" [options]="doughnutOpts" type="doughnut"></canvas>
          </div>
        </mat-card>
        <mat-card class="cc">
          <p class="st"><mat-icon>bar_chart</mat-icon> Causes de retour</p>
          <div class="cw">
            <canvas baseChart [data]="causeData" [options]="causeOpts" type="bar"></canvas>
          </div>
        </mat-card>
      </div>

      <!-- Product issues (admin/qualit\u00e9 only) -->
      <mat-card class="pc" *ngIf="!isEmploye && productIssues().length > 0">
        <p class="st"><mat-icon>precision_manufacturing</mat-icon> D\u00e9fauts &amp; NC par produit</p>
        <div class="pl">
          <div class="pi" *ngFor="let p of productIssues(); let i = index">
            <span class="pn">{{ i + 1 }}</span>
            <div class="pb">
              <div class="ph">
                <span class="pname">{{ p.name }}</span>
                <div class="ptags">
                  <span *ngIf="p.defauts > 0" class="t t-d">{{ p.defauts }}&nbsp;d\u00e9f.</span>
                  <span *ngIf="p.nc > 0" class="t t-nc">{{ p.nc }}&nbsp;NC</span>
                  <span *ngIf="p.gravites.critique > 0" class="t t-crit">{{ p.gravites.critique }}&nbsp;critique</span>
                  <span *ngIf="p.gravites.haute > 0" class="t t-h">{{ p.gravites.haute }}&nbsp;haute</span>
                </div>
                <span class="ptot">{{ p.total }}</span>
              </div>
              <div class="ptr"><span class="pf" [style.width.%]="p.pct"></span></div>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Recent retours table -->
      <mat-card class="tc">
        <div class="th">
          <p class="st nm"><mat-icon>list_alt</mat-icon> {{ isEmploye ? 'Mes derniers retours' : 'Derniers retours' }}</p>
          <a mat-button color="primary" routerLink="/retours">Voir tout</a>
        </div>
        <div class="ep" *ngIf="recentRetours().length === 0">
          <mat-icon>inbox</mat-icon>
          <p>Aucun retour</p>
          <button mat-stroked-button routerLink="/retours/nouveau" *ngIf="isEmploye"><mat-icon>add</mat-icon> Cr\u00e9er</button>
        </div>
        <table mat-table [dataSource]="recentRetours()" class="fw" *ngIf="recentRetours().length > 0">
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
            <td mat-cell *matCellDef="let r"><span class="rc">{{ r.raison }}</span></td>
          </ng-container>
          <ng-container matColumnDef="etat">
            <th mat-header-cell *matHeaderCellDef>\u00c9tat</th>
            <td mat-cell *matCellDef="let r"><app-status-badge [etat]="r.etatTraitement"></app-status-badge></td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let r">{{ r.date | date:'dd/MM/yy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <a mat-icon-button [routerLink]="['/retours', r.id]" matTooltip="Voir les d\u00e9tails">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card>

      <!-- Activity timeline (admin only) -->
      <mat-card class="ac" *ngIf="!isEmploye && stats()?.recentActivite?.length">
        <p class="st"><mat-icon>history</mat-icon> Activit\u00e9 r\u00e9cente</p>
        <div class="al">
          <div class="ai" *ngFor="let a of stats()!.recentActivite; let last = last">
            <div class="aline" *ngIf="!last"></div>
            <div class="adot"></div>
            <div class="ab">
              <span class="am">{{ a.action }}</span>
              <span class="ameta">{{ a.employeNom || 'Syst\u00e8me' }} &middot; {{ a.date | date:'dd/MM HH:mm' }}</span>
              <div class="asts" *ngIf="a.ancienEtat && a.nouvelEtat">
                <span class="as as-o">{{ a.ancienEtat }}</span>
                <mat-icon style="font-size:12px;height:12px;width:12px;color:var(--text-muted)">arrow_forward</mat-icon>
                <span class="as as-n">{{ a.nouvelEtat }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-card>

    </div>
  `,
  styles: [`
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

    /* Header */
    .hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 12px; flex-wrap: wrap; }

    /* Skeleton */
    .sk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .sk-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; animation: shimmer 1.5s ease infinite; }
    .sk { background: var(--border); border-radius: 4px; }
    .sk-n { height: 34px; width: 50%; margin-bottom: 10px; }
    .sk-l { height: 11px; width: 36%; }
    .sk-chart { grid-column: span 2; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); height: 280px; animation: shimmer 1.5s ease infinite; }
    .sk-wide { grid-column: span 4; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); height: 160px; animation: shimmer 1.5s ease infinite; }

    /* KPI strip */
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 20px 20px 16px; border-left: 3px solid var(--border);
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.07); }
    .kpi-teal  { border-left-color: #0d9488; }
    .kpi-amber { border-left-color: #f59e0b; }
    .kpi-green { border-left-color: #22c55e; }
    .kpi-red   { border-left-color: #ef4444; }
    .kpi-blue  { border-left-color: #3b82f6; }
    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .ki { font-size: 18px; height: 18px; width: 18px; color: var(--text-muted); }
    .kpi-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
    .badge-amber { background: rgba(245,158,11,.12); color: #b45309; }
    .badge-red   { background: rgba(239,68,68,.12);  color: #dc2626; }
    .kpi-v {
      margin: 0 0 5px; font-size: 34px; font-weight: 800; line-height: 1;
      font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-primary);
    }
    .kpi-v small { font-size: 18px; font-weight: 600; color: var(--text-muted); }
    .kpi-l { margin: 0; font-size: 11px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }

    /* Alerts */
    .alerts { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .a-pill {
      display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 500; text-decoration: none; border: 1px solid transparent;
    }
    .a-pill mat-icon { font-size: 16px; height: 16px; width: 16px; flex-shrink: 0; }
    .a-pill mat-icon:last-child { margin-left: auto; opacity: .5; }
    .a-danger  { background: rgba(239,68,68,.05);  border-color: rgba(239,68,68,.2);  color: #dc2626; }
    .a-warning { background: rgba(245,158,11,.05); border-color: rgba(245,158,11,.2); color: #b45309; }
    .a-info    { background: rgba(13,148,136,.05); border-color: rgba(13,148,136,.2); color: #0f766e; }

    /* Charts */
    .charts { display: grid; grid-template-columns: 1fr 1.8fr; gap: 16px; margin-bottom: 16px; }
    .cc { padding: 20px !important; }
    .dw { height: 244px; display: flex; justify-content: center; }
    .cw { height: 264px; }
    .st {
      display: flex; align-items: center; gap: 6px; margin: 0 0 16px;
      font-size: 11px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .06em;
    }
    .st mat-icon { font-size: 15px; height: 15px; width: 15px; }
    .nm { margin-bottom: 0; }

    /* Product issues */
    .pc { padding: 20px !important; margin-bottom: 16px; }
    .pl { display: flex; flex-direction: column; gap: 14px; }
    .pi { display: flex; gap: 12px; align-items: flex-start; }
    .pn {
      width: 22px; height: 22px; flex-shrink: 0; margin-top: 3px;
      border-radius: 5px; background: var(--border); color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .pb { flex: 1; min-width: 0; }
    .ph { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
    .pname { font-size: 13px; font-weight: 600; color: var(--text-primary); flex: 1; }
    .ptot { font-size: 13px; font-weight: 700; color: var(--text-muted); font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0; }
    .ptags { display: flex; gap: 4px; flex-wrap: wrap; }
    .t { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
    .t-d    { background: rgba(245,158,11,.1); color: #b45309; }
    .t-nc   { background: rgba(99,102,241,.1); color: #4f46e5; }
    .t-crit { background: rgba(239,68,68,.1);  color: #dc2626; }
    .t-h    { background: rgba(249,115,22,.1); color: #c2410c; }
    .ptr { height: 4px; border-radius: 2px; background: var(--border); overflow: hidden; }
    .pf  { display: block; height: 100%; border-radius: 2px; background: #0d9488; transition: width .6s ease; }

    /* Table */
    .tc { margin-bottom: 16px; }
    .th { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px 0; }
    .fw { width: 100%; }
    .rc { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: var(--surface-raised, #f3f4f6); color: var(--text-secondary); }
    .ep { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 10px; color: var(--text-muted); }
    .ep mat-icon { font-size: 40px; height: 40px; width: 40px; }
    .ep p { margin: 0; }

    /* Activity */
    .ac { padding: 20px !important; }
    .al { display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; }
    .ai { display: flex; gap: 12px; padding: 9px 0; position: relative; }
    .aline { position: absolute; left: 9px; top: 22px; bottom: 0; width: 1px; background: var(--border); }
    .adot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; background: #0d9488; opacity: .6; }
    .ab { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .am { font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ameta { font-size: 11px; color: var(--text-muted); }
    .asts { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
    .as { font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
    .as-o { background: rgba(239,68,68,.08);  color: #dc2626; }
    .as-n { background: rgba(13,148,136,.08); color: #0d9488; }

    @media (max-width: 1100px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .charts { grid-template-columns: 1fr; }
      .sk-chart { grid-column: span 4; }
    }
    @media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 400px) { .kpi-row { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<DashboardStats | null>(null);
  allRetours = signal<RetourProduit[]>([]);
  allNc = signal<NonConformite[]>([]);
  loading = signal(true);
  isEmploye = false;
  userName = '';
  today = new Date();
  cols = ['produit', 'client', 'raison', 'etat', 'date', 'actions'];
  private timer: ReturnType<typeof setInterval> | null = null;

  recentRetours = computed(() => {
    const s = this.stats();
    return (s?.recentRetours?.length ? s.recentRetours : this.allRetours()).slice(0, 8);
  });

  alerts = computed<Alert[]>(() => {
    const s = this.stats();
    if (!s || this.isEmploye) return [];
    const list: Alert[] = [];
    if (s.nonConformitesCritiques > 0)
      list.push({ type: 'danger', icon: 'error', message: `${s.nonConformitesCritiques} NC critique${s.nonConformitesCritiques > 1 ? 's' : ''} â€” action imm\u00e9diate requise`, link: '/non-conformites' });
    if (s.nonConformitesHautes > 0)
      list.push({ type: 'warning', icon: 'warning', message: `${s.nonConformitesHautes} non-conformit\u00e9${s.nonConformitesHautes > 1 ? 's' : ''} de gravit\u00e9 haute`, link: '/non-conformites' });
    if (s.retoursEnAttente > 3)
      list.push({ type: 'info', icon: 'schedule', message: `${s.retoursEnAttente} retours en attente de traitement`, link: '/retours' });
    return list;
  });

  kpiCards = computed<KpiCard[]>(() => {
    const s = this.stats();
    const r = this.allRetours();
    if (this.isEmploye) {
      const att = r.filter(x => x.etatTraitement === EtatTraitement.EN_ATTENTE).length;
      return [
        { icon: 'assignment', label: 'Mes retours', value: r.length, accent: 'teal' },
        { icon: 'schedule', label: 'En attente', value: att, accent: 'amber', badge: att > 0 ? '\u00c0 traiter' : null },
        { icon: 'autorenew', label: 'En cours', value: r.filter(x => x.etatTraitement === EtatTraitement.EN_COURS).length, accent: 'blue' },
        { icon: 'check_circle', label: 'Trait\u00e9s', value: r.filter(x => x.etatTraitement === EtatTraitement.TRAITE).length, accent: 'green' }
      ];
    }
    if (!s) return [];
    return [
      { icon: 'assignment_turned_in', label: 'Total retours', value: s.totalRetours, accent: 'teal' },
      { icon: 'schedule', label: 'En attente', value: s.retoursEnAttente, accent: 'amber', badge: s.retoursEnAttente > 0 ? `${s.retoursEnAttente} \u00e0 traiter` : null },
      { icon: 'trending_up', label: 'Taux de r\u00e9solution', value: Math.round(s.tauxResolution * 10) / 10, suffix: '%', accent: 'green' },
      { icon: 'report_problem', label: 'Non-conformit\u00e9s', value: s.totalNonConformites, accent: 'red', badge: s.nonConformitesCritiques > 0 ? `${s.nonConformitesCritiques} critique${s.nonConformitesCritiques > 1 ? 's' : ''}` : null }
    ];
  });

  productIssues = computed<ProductIssue[]>(() => {
    const map: Record<string, ProductIssue> = {};
    this.allRetours().filter(r => r.raison === 'D\u00e9faut de fabrication').forEach(r => {
      if (!map[r.produit]) map[r.produit] = { name: r.produit, defauts: 0, nc: 0, total: 0, pct: 0, gravites: { critique: 0, haute: 0, moyenne: 0, faible: 0 } };
      map[r.produit].defauts++;
    });
    this.allNc().forEach(nc => {
      if (!map[nc.produit]) map[nc.produit] = { name: nc.produit, defauts: 0, nc: 0, total: 0, pct: 0, gravites: { critique: 0, haute: 0, moyenne: 0, faible: 0 } };
      map[nc.produit].nc++;
      const g = nc.gravite?.toLowerCase() as 'critique' | 'haute' | 'moyenne' | 'faible';
      if (g && map[nc.produit].gravites[g] !== undefined) map[nc.produit].gravites[g]++;
    });
    const items = Object.values(map);
    items.forEach(p => p.total = p.defauts + p.nc);
    items.sort((a, b) => b.total - a.total);
    const top = items.slice(0, 6);
    const mx = top[0]?.total || 1;
    top.forEach(p => p.pct = Math.round((p.total / mx) * 100));
    return top;
  });

  // Professional muted palette: slate=attente, blue=cours, emerald=valide, teal=traite, soft-red=rejete
  private stateColors = ['#94a3b8', '#60a5fa', '#34d399', '#0d9488', '#f87171'];

  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 8 }] };
  doughnutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 11 }, boxWidth: 8 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
    }
  };

  // Single-color cause chart: teal bars with decreasing opacity for ranked display
  causeData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Retours', data: [], backgroundColor: '#0d9488', borderRadius: 4, borderSkipped: false }] };
  causeOpts: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,.04)' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private retourService: RetourService,
    private ncService: NonConformiteService,
    private authService: AuthService
  ) {
    this.isEmploye = !this.authService.isQualite();
    this.userName = this.authService.getCurrentUser()?.nom || '';
  }

  ngOnInit(): void {
    this.loadData();
    this.timer = setInterval(() => this.loadData(), 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadData(): void {
    this.loading.set(true);

    // Employees only need their retours
    if (this.isEmploye) {
      this.retourService.getAll().pipe(catchError(() => of([]))).subscribe(retours => {
        this.allRetours.set(retours);
        this.updateDoughnutFromRetours(retours);
        this.updateCauseChart(retours);
        this.loading.set(false);
      });
      return;
    }

    // Admin/qualitÃ©: fire all 3 calls in parallel, render once when all complete
    forkJoin({
      stats:   this.dashboardService.getStats().pipe(catchError(() => of(null))),
      retours: this.retourService.getAll().pipe(catchError(() => of([]))),
      ncs:     this.ncService.getAll().pipe(catchError(() => of([])))    }).subscribe(({ stats, retours, ncs }) => {
      this.allRetours.set(retours);
      this.allNc.set(ncs);
      if (stats) {
        this.stats.set(stats);
        this.updateDoughnutFromStats(stats);
      } else {
        this.updateDoughnutFromRetours(retours);
      }
      this.updateCauseChart(retours);
      this.loading.set(false);
    });
  }

  private updateDoughnutFromStats(d: DashboardStats): void {
    this.doughnutData = {
      labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
      datasets: [{ data: [d.retoursEnAttente, d.retoursEnCours, d.retoursValides, d.retoursTraites, d.retoursRejetes], backgroundColor: this.stateColors, borderWidth: 0, hoverOffset: 8 }]
    };
  }

  private updateDoughnutFromRetours(retours: RetourProduit[]): void {
    const cnt = (e: EtatTraitement) => retours.filter(r => r.etatTraitement === e).length;
    this.doughnutData = {
      labels: ['En Attente', 'En Cours', 'Valid\u00e9', 'Trait\u00e9', 'Rejet\u00e9'],
      datasets: [{ data: [cnt(EtatTraitement.EN_ATTENTE), cnt(EtatTraitement.EN_COURS), cnt(EtatTraitement.VALIDE), cnt(EtatTraitement.TRAITE), cnt(EtatTraitement.REJETE)], backgroundColor: this.stateColors, borderWidth: 0, hoverOffset: 8 }]
    };
  }

  private updateCauseChart(retours: RetourProduit[]): void {
    const map: Record<string, number> = {};
    retours.forEach(r => { const k = r.raison || 'Autre'; map[k] = (map[k] || 0) + 1; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const colors = sorted.map((_, i) => `rgba(13,148,136,${(1 - i * 0.08).toFixed(2)})`);
    this.causeData = {
      labels: sorted.map(([l]) => l.length > 28 ? l.slice(0, 28) + '\u2026' : l),
      datasets: [{ label: 'Retours', data: sorted.map(([, v]) => v), backgroundColor: colors, borderRadius: 4, borderSkipped: false }]
    };
  }
}
