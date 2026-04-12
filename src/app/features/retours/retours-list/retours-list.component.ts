import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RetourService } from '../../../core/services/retour.service';
import { AuthService } from '../../../core/services/auth.service';
import { RetourProduit, EtatTraitement } from '../../../core/models/retour.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-retours-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, StatusBadgeComponent
  ],
  template: `
    <div class="page-header animate-fade-up">
      <div>
        <h1 class="page-title">Retours Produits</h1>
        <p class="page-subtitle">Gestion et suivi des retours clients</p>
      </div>
      <button mat-raised-button color="primary" routerLink="/retours/nouveau" *ngIf="authService.isEmploye()">
        <mat-icon>add</mat-icon> Nouveau Retour
      </button>
    </div>

    <mat-card class="list-card">
      <mat-card-content>
        <!-- Filters -->
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher…</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Client, produit…">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="state-filter">
            <mat-label>État</mat-label>
            <mat-select [formControl]="etatControl">
              <mat-option value="">Tous les états</mat-option>
              <mat-option *ngFor="let etat of etats" [value]="etat.value">{{ etat.label }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="resetFilters()" class="reset-btn">
            <mat-icon>filter_alt_off</mat-icon> Réinitialiser
          </button>
        </div>

        <!-- Table -->
        <div class="table-container" *ngIf="!loading(); else loadingTpl">
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let r">#{{ r.id }}</td>
            </ng-container>
            <ng-container matColumnDef="produit">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Produit</th>
              <td mat-cell *matCellDef="let r">{{ r.produit }}</td>
            </ng-container>
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Client</th>
              <td mat-cell *matCellDef="let r">{{ r.client }}</td>
            </ng-container>
            <ng-container matColumnDef="raison">
              <th mat-header-cell *matHeaderCellDef>Raison</th>
              <td mat-cell *matCellDef="let r">{{ r.raison }}</td>
            </ng-container>
            <ng-container matColumnDef="etat">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="etatTraitement">État</th>
              <td mat-cell *matCellDef="let r">
                <app-status-badge [etat]="r.etatTraitement"></app-status-badge>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.date | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let r">
                <a mat-icon-button [routerLink]="['/retours', r.id]" matTooltip="Voir détails" color="primary">
                  <mat-icon>visibility</mat-icon>
                </a>
                <a mat-icon-button [routerLink]="['/retours', r.id]" matTooltip="Modifier" color="accent" *ngIf="authService.isQualite()">
                  <mat-icon>edit</mat-icon>
                </a>
                <button mat-icon-button matTooltip="Supprimer" color="warn" *ngIf="authService.isAdmin()" (click)="deleteRetour(r)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          <div *ngIf="dataSource.filteredData.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Aucun retour trouvé</p>
          </div>

          <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25, 50]" showFirstLastButtons></mat-paginator>
        </div>

        <ng-template #loadingTpl>
          <div class="loading-center">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .list-card { }
    .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; padding: 16px 0 0; }
    .search-field { flex: 1; min-width: 200px; }
    .state-filter { min-width: 180px; }
    .reset-btn { flex-shrink: 0; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: #cbd5e1; }
    .empty-state mat-icon { font-size: 56px; height: 56px; width: 56px; }
    .empty-state p { margin: 12px 0 0; font-size: 15px; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    td.mat-mdc-cell:last-child { padding-right: 8px !important; }
  `]
})
export class RetoursListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(true);
  dataSource = new MatTableDataSource<RetourProduit>([]);
  displayedColumns = ['id', 'produit', 'client', 'raison', 'etat', 'date', 'actions'];
  searchControl = new FormControl('');
  etatControl = new FormControl('');

  etats = [
    { value: EtatTraitement.EN_ATTENTE, label: 'En Attente' },
    { value: EtatTraitement.EN_COURS, label: 'En Cours' },
    { value: EtatTraitement.VALIDE, label: 'Validé' },
    { value: EtatTraitement.TRAITE, label: 'Traité' },
    { value: EtatTraitement.REJETE, label: 'Rejeté' }
  ];

  constructor(
    public authService: AuthService,
    private retourService: RetourService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRetours();
    this.searchControl.valueChanges.subscribe(v => this.applyFilter());
    this.etatControl.valueChanges.subscribe(v => this.applyFilter());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRetours(): void {
    this.loading.set(true);
    this.retourService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des retours', 'Fermer', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    const search = (this.searchControl.value || '').toLowerCase();
    const etat = this.etatControl.value || '';
    this.dataSource.filterPredicate = (row: RetourProduit) => {
      const matchesSearch = row.client.toLowerCase().includes(search) || row.produit.toLowerCase().includes(search);
      const matchesEtat = !etat || row.etatTraitement === etat;
      return matchesSearch && matchesEtat;
    };
    this.dataSource.filter = `${search}_${etat}`;
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.etatControl.setValue('');
    this.dataSource.filter = '';
  }

  deleteRetour(retour: RetourProduit): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer le retour', message: `Supprimer le retour #${retour.id} (${retour.produit}) ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.retourService.delete(retour.id).subscribe({
          next: () => {
            this.snackBar.open('Retour supprimé avec succès', 'Fermer', { duration: 3000 });
            this.loadRetours();
          },
          error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 })
        });
      }
    });
  }
}
