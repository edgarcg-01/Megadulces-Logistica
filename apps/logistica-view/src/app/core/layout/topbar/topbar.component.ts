import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, ActivatedRoute, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../services/auth.service';
import { IosPrimeSegmentedComponent } from '../../../shared/components/ui/ios-prime-segmented.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface NavItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, TooltipModule, IosPrimeSegmentedComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-50 px-4 py-3">
      <div class="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 rounded-2xl border border-divider bg-surface-card/90 px-4 py-2.5 backdrop-blur-xl">
        <div class="flex shrink-0 items-center gap-3">
          <img 
            src="/mega-dulces-logo.webp" 
            alt="MegaDulces Logo" 
            class="h-9 w-auto object-contain" />
          <div class="flex flex-col">
            <span class="text-sm font-semibold leading-none tracking-tight text-content-main">MegaDulces</span>
            <span class="text-[10px] uppercase tracking-[0.22em] text-content-muted">Logistica</span>
          </div>
        </div>

        <nav class="flex items-center">
          <app-ios-prime-segmented 
            [options]="navOptions()"
            [(selectedValue)]="currentPath"
            (selectedValueChange)="onNavChange($event)" />
        </nav>

        <div class="flex shrink-0 items-center gap-1.5">
          <!-- Modos -->
          <div class="flex items-center gap-1 px-1.5 py-1 rounded-full border border-divider bg-surface-ground/50">
            <p-button 
              [severity]="isDarkMode() ? 'warn' : 'secondary'" 
              rounded
              text 
              size="small"
              (onClick)="toggleDarkMode()"
              styleClass="w-8 h-8 transition-all active:scale-90"
              [pTooltip]="isDarkMode() ? 'Modo Claro' : 'Modo Oscuro'"
              tooltipPosition="bottom">
              <ng-template pTemplate="icon">
                <app-icon [name]="isDarkMode() ? 'sun' : 'moon'" size="sm"></app-icon>
              </ng-template>
            </p-button>
          </div>

          <div class="h-6 w-px bg-divider mx-1"></div>

          <!-- Perfil y Logout -->
          <div class="flex items-center gap-2 rounded-full border border-divider bg-surface-ground px-3 py-1.5 mr-1">
            <div class="relative">
              <p-avatar 
                icon="pi pi-user" 
                shape="circle" 
                [style]="{width: '24px', height: '24px', 'font-size': '0.7rem'}"
                styleClass="bg-surface-ground text-content-main" />
              <span class="animate-subtle-pulse absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface-card bg-content-main"></span>
            </div>
            <span class="text-xs font-bold text-content-main tracking-tight">{{ username()?.username }}</span>
          </div>
          
          <p-button 
            icon="pi pi-sign-out" 
            severity="secondary" 
            rounded
            text 
            size="small"
            (onClick)="logout()"
            styleClass="w-8 h-8"
            pTooltip="Cerrar sesión"
            tooltipPosition="bottom" />
        </div>
      </div>
    </header>
  `,
  styles: [`
    .nav-active {
      color: var(--active-text) !important;
      background: var(--active-bg) !important;
      font-weight: 600 !important;
    }
  `]
})
export class TopbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/shipments', label: 'Embarques' },
    { path: '/guides', label: 'Guías' },
    { path: '/costs', label: 'Costos' },
    { path: '/fleet', label: 'Flotilla' },
    { path: '/staff', label: 'Colaboradores' },
    { path: '/config', label: 'Catálogos' },
    { path: '/reports', label: 'Reportes' },
  ];

  navOptions = signal<{ label: string, value: string }[]>(
    this.navItems.map(item => ({ label: item.label, value: item.path }))
  );

  currentPath = signal('');

  username = this.authService.user;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event) => {
      const basePath = '/' + event.urlAfterRedirects.split('/')[1];
      const existsInNav = this.navItems.some(item => item.path === basePath);
      
      if (existsInNav && this.currentPath() !== basePath) {
        this.currentPath.set(basePath);
      }
    });

    // Inicializar tema
    this.applyTheme();
  }

  isDarkMode = signal(localStorage.getItem('theme') === 'dark');

  toggleDarkMode() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    const element = document.querySelector('html');
    if (!element) return;
    
    if (this.isDarkMode()) {
      element.classList.add('my-app-dark');
    } else {
      element.classList.remove('my-app-dark');
    }
  }

  onNavChange(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
  }
}
