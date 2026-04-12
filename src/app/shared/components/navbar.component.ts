import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule],
  template: `
    <header class="navbar">
      <!-- Brand -->
      <a class="brand" routerLink="/dashboard">
        <div class="brand-icon">
          <mat-icon>inventory_2</mat-icon>
        </div>
        <span class="brand-name">RetourPro</span>
      </a>

      <!-- Navigation links -->
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
          <span>Non-Conformités</span>
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

      <!-- User section -->
      <div class="user-section">
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
          <button mat-menu-item (click)="logout()" class="logout-item">
            <mat-icon>logout</mat-icon>
            <span>Se déconnecter</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 8px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
      mat-icon { color: white; font-size: 20px; height: 20px; width: 20px; }
    }
    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px;
      font-weight: 800;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.3px;
    }

    /* Nav links */
    .nav-links {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: 24px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 9px;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      color: #64748b;
      transition: background 0.15s ease, color 0.15s ease;
      white-space: nowrap;
      .nav-icon { font-size: 17px; height: 17px; width: 17px; }
    }
    .nav-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .nav-item.active {
      background: #eef2ff;
      color: #6366f1;
      font-weight: 600;
    }

    /* User */
    .user-section { display: flex; align-items: center; margin-left: auto; flex-shrink: 0; }
    .avatar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px 6px 6px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-color: #cbd5e1; }
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: white;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-size: 13px; font-weight: 600; color: #0f172a; line-height: 1.2; }
    .user-role { font-size: 11px; color: #94a3b8; line-height: 1.2; }
    .chevron { color: #94a3b8; font-size: 18px; height: 18px; width: 18px; }

    /* Menu */
    ::ng-deep .user-menu-panel { border-radius: 14px !important; overflow: hidden; min-width: 200px !important; }
    .menu-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8fafc; }
    .menu-avatar {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: white; font-size: 16px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .menu-name { margin: 0; font-size: 14px; font-weight: 600; color: #0f172a; }
    .menu-email { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }
    .logout-item mat-icon { color: #ef4444; }
    .logout-item span { color: #ef4444; font-weight: 500; }

    @media (max-width: 900px) {
      .nav-item span { display: none; }
      .nav-item { padding: 8px; }
    }
    @media (max-width: 640px) {
      .brand-name { display: none; }
      .hide-sm { display: none !important; }
      .navbar { padding: 0 16px; }
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService, private router: Router) {}

  getInitials(): string {
    const nom = this.authService.getCurrentUser()?.nom || '';
    return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(): string {
    const role = this.authService.getCurrentUser()?.role || '';
    const labels: Record<string, string> = {
      ROLE_ADMIN: 'Administrateur',
      ROLE_QUALITE: 'Qualité',
      ROLE_EMPLOYE: 'Employé'
    };
    return labels[role] || role;
  }

  logout(): void {
    this.authService.logout();
  }
}
