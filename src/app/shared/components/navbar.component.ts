import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule],
  template: `
    <header class="navbar">
      <a class="brand" routerLink="/dashboard">
        <svg class="brand-icon-svg" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="10" fill="url(#qt-grad)"/>
          <defs><linearGradient id="qt-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stop-color="#14b8a6"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>
          <circle cx="18" cy="18" r="11" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-dasharray="2 3"/>
          <path d="M23.5 15A7 7 0 1 1 13.5 12.5" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M13.5 8.5L13.5 13L17.5 12.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <div class="brand-text">
          <span class="brand-name">QualiTrack</span>
          <span class="brand-tagline">Suivi des retours</span>
        </div>
      </a>

      <nav class="nav-links">
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <mat-icon class="nav-icon">dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
        <a class="nav-item" routerLink="/retours" routerLinkActive="active">
          <mat-icon class="nav-icon">assignment_return</mat-icon>
          <span>Retours</span>
        </a>
        <a class="nav-item" routerLink="/non-conformites" routerLinkActive="active" *ngIf="authService.isQualite()">
          <mat-icon class="nav-icon">report_problem</mat-icon>
          <span>Non-Conformit&#233;s</span>
        </a>
        <a class="nav-item" routerLink="/historique" routerLinkActive="active" *ngIf="authService.isQualite()">
          <mat-icon class="nav-icon">timeline</mat-icon>
          <span>Historique</span>
        </a>
        <a class="nav-item" routerLink="/utilisateurs" routerLinkActive="active" *ngIf="authService.isAdmin()">
          <mat-icon class="nav-icon">manage_accounts</mat-icon>
          <span>Utilisateurs</span>
        </a>
      </nav>

      <div class="actions-section">
        <button class="theme-toggle" (click)="themeService.toggle()" [matTooltip]="themeService.isDark() ? 'Mode clair' : 'Mode sombre'">
          <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <button class="avatar-btn" [matMenuTriggerFor]="userMenu" matTooltip="Mon compte">
          <div class="avatar">{{ getInitials() }}</div>
          <div class="user-info hide-sm">
            <span class="user-name">{{ authService.getCurrentUser()?.nom }}</span>
            <span class="user-role">{{ getRoleLabel() }}</span>
          </div>
          <mat-icon class="chevron hide-sm">expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="user-menu-panel" xPosition="before">
          <div class="menu-header">
            <div class="menu-avatar">{{ getInitials() }}</div>
            <div>
              <p class="menu-name">{{ authService.getCurrentUser()?.nom }}</p>
              <p class="menu-email">{{ authService.getCurrentUser()?.email }}</p>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="themeService.toggle()">
            <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span>{{ themeService.isDark() ? 'Mode clair' : 'Mode sombre' }}</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()" class="logout-item">
            <mat-icon>logout</mat-icon>
            <span>Se d&#233;connecter</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 1000;
      height: 64px; display: flex; align-items: center;
      padding: 0 24px; gap: 8px;
      background: var(--navbar-bg);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid var(--navbar-border);
      box-shadow: var(--shadow-sm);
      transition: background 0.3s ease, border-color 0.3s ease;
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; flex-shrink: 0;
    }
    .brand-icon-svg {
      width: 36px; height: 36px; flex-shrink: 0;
      filter: drop-shadow(0 4px 12px rgba(13, 148, 136, 0.35));
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px; font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; letter-spacing: -0.3px;
    }
    .brand-tagline {
      font-size: 10px; color: var(--text-muted); font-weight: 500;
      letter-spacing: 0.03em;
    }

    .nav-links {
      display: flex; align-items: center; gap: 2px;
      margin-left: 24px; flex: 1;
    }
    .nav-item {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 9px;
      text-decoration: none; font-size: 13.5px; font-weight: 500;
      color: var(--text-muted);
      transition: background 0.15s ease, color 0.15s ease;
      white-space: nowrap;
      .nav-icon { font-size: 17px; height: 17px; width: 17px; }
    }
    .nav-item:hover { background: var(--surface-hover); color: var(--text-primary); }
    .nav-item.active {
      background: var(--primary-light); color: var(--primary);
      font-weight: 600;
    }

    .actions-section { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }

    .theme-toggle {
      width: 36px; height: 36px; border-radius: 10px;
      border: 1px solid var(--border); background: var(--surface);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      mat-icon { font-size: 18px; height: 18px; width: 18px; color: var(--text-secondary); }
      &:hover { background: var(--surface-hover); border-color: var(--border-strong); transform: scale(1.05); }
    }

    .avatar-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px 6px 6px;
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--surface); cursor: pointer;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
      &:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }
    }
    .avatar {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
    .user-role { font-size: 11px; color: var(--text-muted); line-height: 1.2; }
    .chevron { color: var(--text-muted); font-size: 18px; height: 18px; width: 18px; }

    ::ng-deep .user-menu-panel { border-radius: 14px !important; overflow: hidden; min-width: 200px !important; }
    .menu-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--surface-raised); }
    .menu-avatar {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white; font-size: 16px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .menu-name { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .menu-email { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }
    .logout-item mat-icon { color: var(--error); }
    .logout-item span { color: var(--error); font-weight: 500; }

    @media (max-width: 900px) {
      .nav-item span { display: none; }
      .nav-item { padding: 8px; }
    }
    @media (max-width: 640px) {
      .brand-text { display: none; }
      .hide-sm { display: none !important; }
      .navbar { padding: 0 16px; }
    }
  `]
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  getInitials(): string {
    const nom = this.authService.getCurrentUser()?.nom || '';
    return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(): string {
    const role = this.authService.getCurrentUser()?.role || '';
    const labels: Record<string, string> = {
      ROLE_ADMIN: 'Administrateur',
      ROLE_QUALITE: 'Qualit\u00e9',
      ROLE_EMPLOYE: 'Employ\u00e9'
    };
    return labels[role] || role;
  }

  logout(): void {
    this.authService.logout();
  }
}
