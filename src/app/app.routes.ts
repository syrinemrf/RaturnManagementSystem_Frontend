import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'retours', loadComponent: () => import('./features/retours/retours-list/retours-list.component').then(m => m.RetoursListComponent) },
      { path: 'retours/nouveau', loadComponent: () => import('./features/retours/retour-form/retour-form.component').then(m => m.RetourFormComponent) },
      { path: 'retours/:id', loadComponent: () => import('./features/retours/retour-detail/retour-detail.component').then(m => m.RetourDetailComponent) },
      { path: 'non-conformites', loadComponent: () => import('./features/non-conformites/non-conformites-list.component').then(m => m.NonConformitesListComponent), canActivate: [authGuard] },
      { path: 'utilisateurs', loadComponent: () => import('./features/utilisateurs/utilisateurs-list.component').then(m => m.UtilisateursListComponent), canActivate: [roleGuard], data: { role: 'ROLE_ADMIN' } },
      { path: 'historique', loadComponent: () => import('./features/historique/historique.component').then(m => m.HistoriqueComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
