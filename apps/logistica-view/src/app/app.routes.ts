import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'config',
        loadComponent: () => import('./features/config/config.component').then(m => m.ConfigComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent)
      },
      {
        path: 'fleet',
        loadComponent: () => import('./features/fleet/fleet.component').then(m => m.FleetComponent)
      },
      {
        path: 'shipments',
        loadComponent: () => import('./features/shipments/shipments.component').then(m => m.ShipmentsComponent)
      },
      {
        path: 'guides',
        loadComponent: () => import('./features/guides/guides.component').then(m => m.GuidesComponent)
      },
      {
        path: 'costs',
        loadComponent: () => import('./features/costs/costs.component').then(m => m.CostsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
