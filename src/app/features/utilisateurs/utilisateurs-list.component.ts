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
import { MatChipsModule } from '@angular/material/chips';

import { UtilisateurService } from '../../core/services/utilisateur.service';
import { AuthService } from '../../core/services/auth.service';
import { Utilisateur, RegisterRequest, RoleUtilisateur } from '../../core/models/utilisateur.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-utilisateur-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.user ? 'Modifier' : 'Nouvel' }} Utilisateur</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom *</mat-label>
          <input matInput formControlName="nom">
          <mat-error *ngIf="form.get('nom')?.hasError('required')">Requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email *</mat-label>
          <input matInput type="email" formControlName="email">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Requis</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mot de passe {{ data.user ? '(laisser vide pour ne pas changer)' : '*' }}</mat-label>
          <input matInput type="password" formControlName="motDePasse">
          <mat-error *ngIf="form.get('motDePasse')?.hasError('required')">Requis</mat-error>
          <mat-error *ngIf="form.get('motDePasse')?.hasError('minlength')">6 caractères minimum</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rôle *</mat-label>
          <mat-select formControlName="role">
            <mat-option *ngFor="let r of roles" [value]="r.value">{{ r.label }}</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Annuler</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`.user-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; } .full-width { width: 100%; }`]
})
export class UtilisateurFormDialogComponent {
  form: FormGroup;
  roles = [
    { value: RoleUtilisateur.ROLE_ADMIN, label: 'Administrateur' },
    { value: RoleUtilisateur.ROLE_QUALITE, label: 'Qualité' },
    { value: RoleUtilisateur.ROLE_EMPLOYE, label: 'Employé' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UtilisateurFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: Utilisateur | null }
  ) {
    const isEdit = !!data.user;
    this.form = this.fb.group({
      nom: [data.user?.nom || '', Validators.required],
      email: [data.user?.email || '', [Validators.required, Validators.email]],
      motDePasse: ['', isEdit ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      role: [data.user?.role || RoleUtilisateur.ROLE_EMPLOYE, Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    if (!val.motDePasse) delete val.motDePasse;
    this.dialogRef.close(val);
  }
}

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, MatChipsModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Gestion des Utilisateurs</h1>
        <p class="subtitle">Administration des comptes</p>
      </div>
      <button mat-raised-button color="primary" (click)="openForm(null)">
        <mat-icon>person_add</mat-icon> Nouvel Utilisateur
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Nom, email...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="table-container" *ngIf="!loading(); else loadingTpl">
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="nom">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
              <td mat-cell *matCellDef="let u">{{ u.nom }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Rôle</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [style.background-color]="getRoleColor(u.role)" style="color:white; font-size:12px; font-weight:500;">
                  {{ getRoleLabel(u.role) }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date création</th>
              <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button matTooltip="Modifier" color="accent" (click)="openForm(u)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Supprimer" color="warn" (click)="deleteUser(u)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
          <div *ngIf="dataSource.filteredData.length === 0" class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>Aucun utilisateur trouvé</p>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .filter-bar { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 200px; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .table-row:hover { background: #f5f5f5; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #ccc; }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class UtilisateursListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(true);
  dataSource = new MatTableDataSource<Utilisateur>([]);
  displayedColumns = ['nom', 'email', 'role', 'createdAt', 'actions'];
  searchControl = new FormControl('');

  constructor(
    public authService: AuthService,
    private userService: UtilisateurService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.subscribe(() => {
      this.dataSource.filter = (this.searchControl.value || '').toLowerCase();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (row: Utilisateur, filter: string) =>
      row.nom.toLowerCase().includes(filter) || row.email.toLowerCase().includes(filter);
  }

  load(): void {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => { this.dataSource.data = data; this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 }); }
    });
  }

  getRoleLabel(role: RoleUtilisateur): string {
    return { ROLE_ADMIN: 'Admin', ROLE_QUALITE: 'Qualité', ROLE_EMPLOYE: 'Employé' }[role] || role;
  }

  getRoleColor(role: RoleUtilisateur): string {
    return { ROLE_ADMIN: '#7b1fa2', ROLE_QUALITE: '#00796b', ROLE_EMPLOYE: '#1565c0' }[role] || '#9e9e9e';
  }

  openForm(user: Utilisateur | null): void {
    const ref = this.dialog.open(UtilisateurFormDialogComponent, { data: { user }, width: '500px' });
    ref.afterClosed().subscribe((req: Partial<RegisterRequest> | null) => {
      if (!req) return;
      const obs = user ? this.userService.update(user.id, req) : this.userService.create(req as RegisterRequest);
      obs.subscribe({
        next: () => { this.snackBar.open(user ? 'Utilisateur mis à jour' : 'Utilisateur créé', 'Fermer', { duration: 3000 }); this.load(); },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    });
  }

  deleteUser(user: Utilisateur): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer', message: `Supprimer l'utilisateur ${user.nom} ?` } });
    ref.afterClosed().subscribe(ok => {
      if (ok) this.userService.delete(user.id).subscribe({
        next: () => { this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 }); this.load(); },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    });
  }
}
