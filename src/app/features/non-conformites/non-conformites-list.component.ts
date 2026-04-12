import { Component, OnInit, signal, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NonConformiteService } from '../../core/services/nonconformite.service';
import { RetourService } from '../../core/services/retour.service';
import { AuthService } from '../../core/services/auth.service';
import { NonConformite, NonConformiteRequest, Gravite } from '../../core/models/nonconformite.model';
import { RetourProduit } from '../../core/models/retour.model';
import { GraviteBadgeComponent } from '../../shared/components/gravite-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-nc-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.nc ? 'Modifier' : 'Nouvelle' }} Non-Conformité</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="nc-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Produit *</mat-label>
          <input matInput formControlName="produit">
          <mat-error *ngIf="form.get('produit')?.hasError('required')">Requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description *</mat-label>
          <textarea matInput formControlName="description" rows="4"></textarea>
          <mat-error *ngIf="form.get('description')?.hasError('required')">Requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Gravité *</mat-label>
          <mat-select formControlName="gravite">
            <mat-option *ngFor="let g of gravites" [value]="g.value">{{ g.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" *ngIf="retours.length > 0">
          <mat-label>Retour lié (optionnel)</mat-label>
          <mat-select formControlName="retourId">
            <mat-option [value]="null">Aucun</mat-option>
            <mat-option *ngFor="let r of retours" [value]="r.id">#{{ r.id }} – {{ r.produit }}</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Annuler</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        <mat-spinner *ngIf="saving" diameter="20" style="display:inline-block;margin-right:8px;"></mat-spinner>
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.nc-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; } .full-width { width: 100%; }`]
})
export class NcFormDialogComponent {
  form: FormGroup;
  saving = false;
  retours: RetourProduit[] = [];
  gravites = [
    { value: Gravite.FAIBLE, label: 'Faible' },
    { value: Gravite.MOYENNE, label: 'Moyenne' },
    { value: Gravite.HAUTE, label: 'Haute' },
    { value: Gravite.CRITIQUE, label: 'Critique' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<NcFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nc: NonConformite | null; retours: RetourProduit[] }
  ) {
    this.retours = data.retours || [];
    this.form = this.fb.group({
      produit: [data.nc?.produit || '', Validators.required],
      description: [data.nc?.description || '', Validators.required],
      gravite: [data.nc?.gravite || Gravite.MOYENNE, Validators.required],
      retourId: [data.nc?.retourId || null]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as NonConformiteRequest);
  }
}

@Component({
  selector: 'app-non-conformites-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, GraviteBadgeComponent
  ],
  template: `
    <div class="page-header animate-fade-up">
      <div>
        <h1 class="page-title">Non-Conformités</h1>
        <p class="page-page-subtitle">Gestion des anomalies qualité</p>
      </div>
      <button mat-raised-button color="primary" (click)="openForm(null)" *ngIf="authService.isQualite()">
        <mat-icon>add</mat-icon> Nouvelle NC
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Produit, description...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Filtrer par gravité</mat-label>
            <mat-select [formControl]="graviteControl">
              <mat-option value="">Toutes</mat-option>
              <mat-option *ngFor="let g of gravites" [value]="g.value">{{ g.label }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="resetFilters()">
            <mat-icon>clear</mat-icon> Réinitialiser
          </button>
        </div>

        <div class="table-container" *ngIf="!loading(); else loadingTpl">
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let nc">#{{ nc.id }}</td>
            </ng-container>
            <ng-container matColumnDef="produit">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Produit</th>
              <td mat-cell *matCellDef="let nc">{{ nc.produit }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let nc" class="desc-cell">{{ nc.description }}</td>
            </ng-container>
            <ng-container matColumnDef="gravite">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Gravité</th>
              <td mat-cell *matCellDef="let nc">
                <app-gravite-badge [gravite]="nc.gravite"></app-gravite-badge>
              </td>
            </ng-container>
            <ng-container matColumnDef="retour">
              <th mat-header-cell *matHeaderCellDef>Retour lié</th>
              <td mat-cell *matCellDef="let nc">{{ nc.retourId ? '#' + nc.retourId : '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let nc">{{ nc.date | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let nc">
                <button mat-icon-button matTooltip="Modifier" color="accent" *ngIf="authService.isQualite()" (click)="openForm(nc)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Supprimer" color="warn" *ngIf="authService.isAdmin()" (click)="deleteNc(nc)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
          <div *ngIf="dataSource.filteredData.length === 0" class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <p>Aucune non-conformité trouvée</p>
          </div>
          <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons></mat-paginator>
        </div>
        <ng-template #loadingTpl>
          <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; padding: 16px 0 0; }
    .search-field { flex: 1; min-width: 200px; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .desc-cell { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #475569; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: #cbd5e1; }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; }
    .loading-center { display: flex; justify-content: center; padding: 64
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(true);
  dataSource = new MatTableDataSource<NonConformite>([]);
  displayedColumns = ['id', 'produit', 'description', 'gravite', 'retour', 'date', 'actions'];
  searchControl = new FormControl('');
  graviteControl = new FormControl('');
  retours: RetourProduit[] = [];

  gravites = [
    { value: Gravite.FAIBLE, label: 'Faible' },
    { value: Gravite.MOYENNE, label: 'Moyenne' },
    { value: Gravite.HAUTE, label: 'Haute' },
    { value: Gravite.CRITIQUE, label: 'Critique' }
  ];

  constructor(
    public authService: AuthService,
    private ncService: NonConformiteService,
    private retourService: RetourService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
    this.retourService.getAll().subscribe(r => this.retours = r);
    this.searchControl.valueChanges.subscribe(() => this.applyFilter());
    this.graviteControl.valueChanges.subscribe(() => this.applyFilter());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  load(): void {
    this.loading.set(true);
    this.ncService.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 }); }
    });
  }

  applyFilter(): void {
    const search = (this.searchControl.value || '').toLowerCase();
    const gravite = this.graviteControl.value || '';
    this.dataSource.filterPredicate = (row: NonConformite) =>
      (row.produit.toLowerCase().includes(search) || row.description.toLowerCase().includes(search)) &&
      (!gravite || row.gravite === gravite);
    this.dataSource.filter = `${search}_${gravite}`;
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.graviteControl.setValue('');
    this.dataSource.filter = '';
  }

  openForm(nc: NonConformite | null): void {
    const ref = this.dialog.open(NcFormDialogComponent, { data: { nc, retours: this.retours }, width: '500px' });
    ref.afterClosed().subscribe((req: NonConformiteRequest | null) => {
      if (!req) return;
      const obs = nc ? this.ncService.update(nc.id, req) : this.ncService.create(req);
      obs.subscribe({
        next: () => { this.snackBar.open(nc ? 'NC mise à jour' : 'NC créée', 'Fermer', { duration: 3000 }); this.load(); },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    });
  }

  deleteNc(nc: NonConformite): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer', message: `Supprimer la NC #${nc.id} ?` } });
    ref.afterClosed().subscribe(ok => {
      if (ok) this.ncService.delete(nc.id).subscribe({
        next: () => { this.snackBar.open('NC supprimée', 'Fermer', { duration: 3000 }); this.load(); },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    });
  }
}
