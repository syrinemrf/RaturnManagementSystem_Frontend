import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    @media (max-width: 600px) {
      .main-content { padding: 12px; }
    }
  `]
})
export class MainLayoutComponent {}
