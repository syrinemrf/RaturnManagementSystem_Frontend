import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <div class="brand-panel">
        <div class="brand-panel-inner">
          <div class="logo-wrap">
            <div class="logo-box">
              <mat-icon>verified_user</mat-icon>
            </div>
            <div class="logo-text">
              <span class="logo-name">QualiTrack</span>
              <span class="logo-tagline">Suivi des retours</span>
            </div>
          </div>

          <h1 class="brand-headline">
            Pilotez la qualit&#233;<br><span class="highlight">de vos retours</span>
          </h1>
          <p class="brand-sub">
            Plateforme centralis&#233;e pour le suivi, la qualification et la r&#233;solution des retours produits.
          </p>

          <ul class="feature-list">
            <li *ngFor="let f of features" class="feature-item">
              <div class="feature-icon-wrap">
                <mat-icon>{{ f.icon }}</mat-icon>
              </div>
              <div>
                <strong>{{ f.title }}</strong>
                <p>{{ f.desc }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>

      <div class="form-panel">
        <div class="form-wrap animate-fade-up">
          <div class="form-header">
            <h2>Connexion</h2>
            <p>Bienvenue ! Entrez vos identifiants pour continuer.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="field-group">
              <label class="field-label">Adresse email</label>
              <mat-form-field appearance="outline" class="full-width">
                <input matInput type="email" formControlName="email" placeholder="nom&#64;entreprise.com" autocomplete="email">
                <mat-icon matSuffix class="field-suffix-icon">alternate_email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email requis</mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Format invalide</mat-error>
              </mat-form-field>
            </div>

            <div class="field-group">
              <label class="field-label">Mot de passe</label>
              <mat-form-field appearance="outline" class="full-width">
                <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="motDePasse" autocomplete="current-password">
                <button type="button" mat-icon-button matSuffix (click)="togglePassword()" class="visibility-btn">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('motDePasse')?.hasError('required')">Mot de passe requis</mat-error>
              </mat-form-field>
            </div>

            <div class="error-banner" *ngIf="errorMessage()">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <button class="submit-btn" type="submit" [disabled]="loginForm.invalid || loading()">
              <mat-spinner *ngIf="loading()" diameter="18" class="btn-spinner"></mat-spinner>
              <mat-icon *ngIf="!loading()">login</mat-icon>
              <span>{{ loading() ? 'Connexion...' : 'Se connecter' }}</span>
            </button>
          </form>

          <div class="demo-box">
            <p class="demo-title">
              <mat-icon>info_outline</mat-icon>
              Comptes de d&#233;monstration
            </p>
            <div class="demo-accounts">
              <div class="demo-account" *ngFor="let d of demoAccounts" (click)="fillDemo(d)">
                <div class="demo-role-badge" [style.background]="d.color">{{ d.role }}</div>
                <code>{{ d.email }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; min-height: 100vh; }

    .brand-panel {
      flex: 0 0 52%; position: relative; overflow: hidden;
      background: linear-gradient(145deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%);
      display: flex; align-items: center; justify-content: center; padding: 48px;
    }
    .brand-panel-inner { position: relative; z-index: 1; max-width: 440px; color: white; }

    .logo-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .logo-box {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: white; font-size: 26px; height: 26px; width: 26px; }
    }
    .logo-text { display: flex; flex-direction: column; }
    .logo-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 22px; font-weight: 800; color: white;
    }
    .logo-tagline { font-size: 11px; opacity: 0.75; letter-spacing: 0.05em; text-transform: uppercase; }

    .brand-headline {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 42px; font-weight: 800; line-height: 1.2;
      margin: 0 0 16px; color: white;
    }
    .highlight { color: #93c5fd; }
    .brand-sub { font-size: 15px; opacity: 0.85; line-height: 1.6; margin: 0 0 40px; }

    .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
    .feature-item { display: flex; align-items: flex-start; gap: 14px; }
    .feature-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { color: white; font-size: 20px; height: 20px; width: 20px; }
    }
    .feature-item strong { display: block; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .feature-item p { margin: 0; font-size: 13px; opacity: 0.75; }

    .blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.06); pointer-events: none; }
    .blob-1 { width: 400px; height: 400px; top: -120px; right: -100px; }
    .blob-2 { width: 300px; height: 300px; bottom: -80px; left: -60px; }

    .form-panel {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 48px 40px; background: var(--bg); overflow-y: auto;
    }
    .form-wrap { width: 100%; max-width: 400px; }

    .form-header { margin-bottom: 32px; }
    .form-header h2 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;
    }
    .form-header p { margin: 0; color: var(--text-secondary); font-size: 14px; }

    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .full-width { width: 100%; }
    .field-suffix-icon { color: var(--text-muted); font-size: 18px; }
    .visibility-btn { color: var(--text-muted) !important; }

    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: var(--error-light); color: var(--error);
      border: 1px solid currentColor; border-radius: 10px;
      padding: 10px 14px; font-size: 13px; font-weight: 500;
      mat-icon { font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; }
    }

    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; height: 48px; border: none; border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white; font-size: 15px; font-weight: 600;
      font-family: inherit; letter-spacing: 0.01em;
      box-shadow: 0 6px 20px rgba(37,99,235,0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      margin-top: 8px;
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,99,235,0.4); }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    }
    .btn-spinner { display: inline-block; }
    ::ng-deep .btn-spinner circle { stroke: white !important; }

    .demo-box {
      margin-top: 28px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 14px; padding: 16px;
    }
    .demo-title {
      display: flex; align-items: center; gap: 6px;
      margin: 0 0 12px; font-size: 12px; font-weight: 600;
      color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em;
      mat-icon { font-size: 14px; height: 14px; width: 14px; }
    }
    .demo-accounts { display: flex; flex-direction: column; gap: 8px; }
    .demo-account {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface-raised);
      cursor: pointer; transition: background 0.15s ease;
      &:hover { background: var(--surface-hover); }
      code { font-size: 12px; color: var(--text-secondary); }
    }
    .demo-role-badge {
      font-size: 10px; font-weight: 700; color: white;
      padding: 2px 8px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0;
    }

    @media (max-width: 900px) {
      .brand-panel { display: none; }
      .form-panel { padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  features = [
    { icon: 'track_changes', title: 'Suivi en temps r\u00e9el', desc: 'Suivez l\u0027\u00e9tat de chaque retour instantan\u00e9ment.' },
    { icon: 'verified', title: 'Contr\u00f4le qualit\u00e9', desc: 'G\u00e9rez les non-conformit\u00e9s et leurs gravit\u00e9s.' },
    { icon: 'people_alt', title: 'Collaboration d\u0027\u00e9quipe', desc: 'R\u00f4les Admin, Qualit\u00e9 et Employ\u00e9 pour chaque besoin.' }
  ];

  demoAccounts = [
    { role: 'Admin', email: 'admin@retours.com', password: 'Admin123!', color: '#2563eb' },
    { role: 'Qualit\u00e9', email: 'qualite@retours.com', password: 'Qualite123!', color: '#059669' },
    { role: 'Employ\u00e9', email: 'employe@retours.com', password: 'Employe123!', color: '#d97706' }
  ];

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

  fillDemo(d: { email: string; password: string }): void {
    this.loginForm.patchValue({ email: d.email, motDePasse: d.password });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    const { email, motDePasse } = this.loginForm.value;
    this.auth.login({ email, motDePasse }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Identifiants incorrects. Veuillez r\u00e9essayer.');
      }
    });
  }
}
