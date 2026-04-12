import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content animate-fade">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      padding: 28px 32px;
      max-width: 1440px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }
    @media (max-width: 768px) {
      .main-content { padding: 16px; }
    }
  `]
})
export class MainLayoutComponent {}
