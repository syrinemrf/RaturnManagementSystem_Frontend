import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="login-header">
            <mat-icon class="logo-icon">inventory_2</mat-icon>
            <mat-card-title>Gestion des Retours</mat-card-title>
            <mat-card-subtitle>Connectez-vous à votre compte</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adresse email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="admin@retours.com" autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email requis</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Email invalide</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="motDePasse" autocomplete="current-password">
              <button type="button" mat-icon-button matSuffix (click)="togglePassword()">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('motDePasse')?.hasError('required')">Mot de passe requis</mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage()">
              <mat-icon>error_outline</mat-icon>
              {{ errorMessage() }}
            </div>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                    [disabled]="loginForm.invalid || loading()">
              <mat-spinner *ngIf="loading()" diameter="20" style="display:inline-block; margin-right: 8px;"></mat-spinner>
              {{ loading() ? 'Connexion...' : 'Se connecter' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <p class="hint-title">Comptes de démonstration :</p>
          <p class="hint">Admin: admin&#64;retours.com / Admin123!</p>
          <p class="hint">Qualité: qualite&#64;retours.com / Qualite123!</p>
          <p class="hint">Employé: employe&#64;retours.com / Employe123!</p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3f51b5 0%, #283593 100%);
      padding: 16px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 8px;
      width: 100%;
    }
    .logo-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #3f51b5;
      margin-bottom: 12px;
    }
    mat-card-title { font-size: 22px; text-align: center; }
    mat-card-subtitle { text-align: center; }
    .login-form { display: flex; flex-direction: column; gap: 8px; padding: 16px 0; }
    .full-width { width: 100%; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: #ffebee;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    .login-footer {
      padding: 16px 24px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 12px 12px;
    }
    .hint-title { font-weight: 600; margin: 0 0 4px; font-size: 13px; color: #333; }
    .hint { margin: 2px 0; font-size: 12px; color: #666; font-family: monospace; }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    if (auth.isLoggedIn()) {
      router.navigate(['/dashboard']);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.status === 401
          ? 'Email ou mot de passe incorrect.'
          : 'Erreur de connexion. Vérifiez le serveur.');
      }
    });
  }
}
