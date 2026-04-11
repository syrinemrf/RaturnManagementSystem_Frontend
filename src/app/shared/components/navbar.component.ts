import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="app-title">
        <mat-icon style="vertical-align: middle; margin-right: 8px;">inventory_2</mat-icon>
        Gestion Retours
      </span>
      <span class="spacer"></span>
      <nav class="nav-links">
        <a mat-button routerLink="/dashboard" routerLinkActive="active-link">
          <mat-icon>dashboard</mat-icon> Dashboard
        </a>
        <a mat-button routerLink="/retours" routerLinkActive="active-link">
          <mat-icon>assignment_return</mat-icon> Retours
        </a>
        <a mat-button routerLink="/non-conformites" routerLinkActive="active-link" *ngIf="authService.isQualite()">
          <mat-icon>warning</mat-icon> Non-Conformités
        </a>
        <a mat-button routerLink="/historique" routerLinkActive="active-link" *ngIf="authService.isQualite()">
          <mat-icon>history</mat-icon> Historique
        </a>
        <a mat-button routerLink="/utilisateurs" routerLinkActive="active-link" *ngIf="authService.isAdmin()">
          <mat-icon>people</mat-icon> Utilisateurs
        </a>
      </nav>
      <span class="user-section">
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ authService.getCurrentUser()?.nom }}
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div mat-menu-item disabled style="font-size:12px; color:#666;">
            {{ authService.getCurrentUser()?.role }}
          </div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Se déconnecter
          </button>
        </mat-menu>
      </span>
    </mat-toolbar>
  `,
  styles: [`
    .navbar { position: sticky; top: 0; z-index: 1000; }
    .app-title { font-size: 20px; font-weight: 600; display: flex; align-items: center; }
    .spacer { flex: 1; }
    .nav-links { display: flex; align-items: center; gap: 4px; }
    .nav-links a { display: flex; align-items: center; gap: 4px; }
    .active-link { background: rgba(255,255,255,0.2) !important; border-radius: 4px; }
    .user-section { display: flex; align-items: center; }
    @media (max-width: 768px) {
      .nav-links a span { display: none; }
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
  }
}
