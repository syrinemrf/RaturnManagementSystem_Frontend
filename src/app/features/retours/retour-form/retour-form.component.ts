import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { RetourService } from '../../../core/services/retour.service';
import { AuthService } from '../../../core/services/auth.service';
import { RetourProduit, EtatTraitement, RetourRequest, ChangerEtatRequest } from '../../../core/models/retour.model';

@Component({
  selector: 'app-retour-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/retours">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ isEditMode() ? 'Modifier le Retour #' + retourId() : 'Nouveau Retour' }}</h1>
    </div>

    <div *ngIf="loadingData()" class="loading-center">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!loadingData()" class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Informations du Retour</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="retourForm" (ngSubmit)="onSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Produit *</mat-label>
              <input matInput formControlName="produit" placeholder="Nom du produit">
              <mat-error *ngIf="retourForm.get('produit')?.hasError('required')">Produit requis</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Client *</mat-label>
              <input matInput formControlName="client" placeholder="Nom du client">
              <mat-error *ngIf="retourForm.get('client')?.hasError('required')">Client requis</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-col">
              <mat-label>Raison *</mat-label>
              <input matInput formControlName="raison" placeholder="Motif du retour">
              <mat-error *ngIf="retourForm.get('raison')?.hasError('required')">Raison requise</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-col">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4" placeholder="Description détaillée..."></textarea>
            </mat-form-field>

            <div class="form-actions full-col">
              <button mat-stroked-button type="button" routerLink="/retours">Annuler</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="retourForm.invalid || saving()">
                <mat-spinner *ngIf="saving()" diameter="20" style="display:inline-block; margin-right:8px;"></mat-spinner>
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Change State Section (edit mode, QUALITE+) -->
      <mat-card *ngIf="isEditMode() && authService.isQualite()" class="state-card">
        <mat-card-header>
          <mat-card-title>Changer l'État</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="etatForm" (ngSubmit)="changerEtat()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nouvel état *</mat-label>
              <mat-select formControlName="nouvelEtat">
                <mat-option *ngFor="let e of etats" [value]="e.value">{{ e.label }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-col">
              <mat-label>Commentaire</mat-label>
              <textarea matInput formControlName="commentaire" rows="3" placeholder="Commentaire sur le changement d'état..."></textarea>
            </mat-form-field>

            <div class="form-actions full-col">
              <button mat-raised-button color="accent" type="submit" [disabled]="etatForm.invalid || changingEtat()">
                <mat-spinner *ngIf="changingEtat()" diameter="20" style="display:inline-block; margin-right:8px;"></mat-spinner>
                {{ changingEtat() ? 'Application...' : 'Appliquer le changement' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .loading-center { display: flex; justify-content: center; padding: 48px; }
    .form-container { display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-col { grid-column: 1 / -1; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
    .state-card { border-left: 4px solid #3f51b5; }
  `]
})
export class RetourFormComponent implements OnInit {
  retourForm: FormGroup;
  etatForm: FormGroup;
  isEditMode = signal(false);
  retourId = signal<number | null>(null);
  loading = signal(false);
  loadingData = signal(false);
  saving = signal(false);
  changingEtat = signal(false);

  etats = [
    { value: EtatTraitement.EN_ATTENTE, label: 'En Attente' },
    { value: EtatTraitement.EN_COURS, label: 'En Cours' },
    { value: EtatTraitement.VALIDE, label: 'Validé' },
    { value: EtatTraitement.TRAITE, label: 'Traité' },
    { value: EtatTraitement.REJETE, label: 'Rejeté' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private retourService: RetourService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.retourForm = this.fb.group({
      produit: ['', Validators.required],
      client: ['', Validators.required],
      raison: ['', Validators.required],
      description: ['']
    });

    this.etatForm = this.fb.group({
      nouvelEtat: ['', Validators.required],
      commentaire: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nouveau') {
      this.isEditMode.set(true);
      this.retourId.set(+id);
      this.loadRetour(+id);
    }
  }

  loadRetour(id: number): void {
    this.loadingData.set(true);
    this.retourService.getById(id).subscribe({
      next: (r) => {
        this.retourForm.patchValue({ produit: r.produit, client: r.client, raison: r.raison, description: r.description });
        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
        this.snackBar.open('Retour introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/retours']);
      }
    });
  }

  onSubmit(): void {
    if (this.retourForm.invalid) return;
    this.saving.set(true);
    const user = this.authService.getCurrentUser();
    const req: RetourRequest = { ...this.retourForm.value, utilisateurId: user ? undefined : undefined };

    const obs = this.isEditMode()
      ? this.retourService.update(this.retourId()!, req)
      : this.retourService.create(req);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(this.isEditMode() ? 'Retour mis à jour' : 'Retour créé avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/retours']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
      }
    });
  }

  changerEtat(): void {
    if (this.etatForm.invalid) return;
    this.changingEtat.set(true);
    const user = this.authService.getCurrentUser();
    const req: ChangerEtatRequest = { ...this.etatForm.value, employeId: 1 };

    this.retourService.changerEtat(this.retourId()!, req).subscribe({
      next: () => {
        this.changingEtat.set(false);
        this.snackBar.open('État modifié avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/retours']);
      },
      error: () => {
        this.changingEtat.set(false);
        this.snackBar.open('Erreur lors du changement d\'état', 'Fermer', { duration: 3000 });
      }
    });
  }
}
