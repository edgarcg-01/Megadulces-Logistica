import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBar } from 'primeng/progressbar';
import { ProgressSpinner } from 'primeng/progressspinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DeliveryWizardComponent } from '../../shared/components/delivery-wizard/delivery-wizard.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SHIPMENT_STATUS } from '../../core/models/logistics.models';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentEstado } from '../../core/services/shipments-driver.service';

interface DriverShipment {
  id: string;
  folio: string;
  fecha: string;
  origen: string;
  destino: string;
  estado: string;
  unidad_placa: string;
  chofer_nombre: string;
  guia_id: string;
  guia_tipo: string;
  guia_estado: string;
}

@Component({
  selector: 'app-driver-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, CardModule, InputTextModule, ProgressBar, ProgressSpinner, DeliveryWizardComponent],
  template: `
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-logistics-text">Mis Entregas</h1>
          <p class="text-logistics-text-mid">Gestiona tus embarques asignados</p>
        </div>
        <p-button 
          label="Cerrar Sesión" 
          icon="pi pi-sign-out" 
          severity="danger" 
          (onClick)="logout()"
        />
      </div>

      <p-card class="mb-6">
        <div class="flex items-center gap-4">
          <i class="pi pi-info-circle text-logistics-accent text-2xl"></i>
          <div>
            <h3 class="font-semibold text-logistics-text">Instrucciones</h3>
            <p class="text-sm text-logistics-text-mid">
              1. Completa la inspección del vehículo antes de salir<br>
              2. Al llegar, sube una foto de la entrega<br>
              3. Completa el checklist de llegada para confirmar
            </p>
          </div>
        </div>
      </p-card>

      <div *ngIf="loading()" class="text-center py-8">
        <p-progressSpinner></p-progressSpinner>
        <p class="mt-4 text-logistics-text-mid">Cargando embarques...</p>
      </div>

      <div *ngIf="!loading() && shipments().length === 0" class="text-center py-12">
        <i class="pi pi-box text-6xl text-logistics-text-mid mb-4"></i>
        <h3 class="text-xl font-semibold text-logistics-text">No tienes embarques pendientes</h3>
        <p class="text-logistics-text-mid">Cuando se te asigne un embarque, aparecerá aquí</p>
      </div>

      <p-table 
        *ngIf="!loading() && shipments().length > 0"
        [value]="shipments()" 
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 20]">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Ruta</th>
            <th>Unidad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-shipment>
          <tr>
            <td class="font-semibold">{{ shipment.folio }}</td>
            <td>{{ formatDate(shipment.fecha) }}</td>
            <td>
              <div class="flex items-center gap-2">
                <i class="pi pi-map-marker text-logistics-accent"></i>
                <span>{{ shipment.origen }} → {{ shipment.destino }}</span>
              </div>
            </td>
            <td>{{ shipment.unidad_placa }}</td>
            <td>
              <p-tag [value]="getStatusLabel(shipment.estado)" [severity]="getStatusSeverity(shipment.estado)"></p-tag>
            </td>
            <td>
              <p-button 
                label="Iniciar Entrega"
                icon="pi pi-play"
                (onClick)="startDelivery(shipment)"
                [class]="'p-button-brand'"
                [disabled]="shipment.estado === 'entregado' || shipment.estado === 'completado' || shipment.guia_estado === 'completado' || shipment.guia_estado === 'completada'">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <app-delivery-wizard
        [visible]="showWizard()"
        [embarqueId]="selectedShipmentId()"
        [embarqueEstado]="selectedShipmentEstado()"
        (visibleChange)="onWizardVisibleChange($event)"
        (deliveryCompleted)="onDeliveryCompleted()"
        (estadoChange)="onEstadoChange($event)">
      </app-delivery-wizard>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DriverAssignmentsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private apiUrl = environment.apiUrl;

  shipments = signal<DriverShipment[]>([]);
  loading = signal(true);
  showWizard = signal(false);
  selectedShipmentId = signal('');
  selectedShipmentEstado = signal<ShipmentEstado>('programado');

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.loading.set(true);
    const user = this.authService.user();
    
    if (!user?.sub) {
      console.error('Usuario no autenticado');
      this.shipments.set([]);
      this.loading.set(false);
      return;
    }
    
    this.http.get<DriverShipment[]>(`${this.apiUrl}/shipments/driver/${user.sub}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.shipments.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar embarques:', err);
          this.shipments.set([]);
          this.loading.set(false);
        }
      });
  }

  startDelivery(shipment: DriverShipment) {
    this.selectedShipmentId.set(shipment.id);
    this.selectedShipmentEstado.set(shipment.estado as ShipmentEstado);
    this.showWizard.set(true);
  }

  onWizardVisibleChange(visible: boolean) {
    console.log('onWizardVisibleChange called:', visible);
    this.showWizard.set(visible);
    if (!visible) {
      console.log('Wizard closing, resetting selectedShipmentId');
      this.selectedShipmentId.set('');
    }
  }

  onDeliveryCompleted() {
    // Recargar la lista de embarques
    this.loadAssignments();
  }

  onEstadoChange(nuevoEstado: ShipmentEstado) {
    // Actualizar el estado local del embarque seleccionado
    this.selectedShipmentEstado.set(nuevoEstado);
    // Recargar la lista para reflejar el cambio
    this.loadAssignments();
  }

  logout() {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'generado': 'Generado',
      'programado': 'Programado',
      'en_transito': 'En Tránsito',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
      'en_proceso': 'En Proceso',
      'asignada': 'Asignada',
      'en_preparacion': 'En Preparación',
      'en_entrega': 'En Entrega',
      'completado': 'Completado',
      'completada': 'Completado',
      'pendiente': 'Pendiente',
      'en_ruta': 'En Ruta'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'generado': 'info',
      'programado': 'info',
      'en_transito': 'warn',
      'entregado': 'success',
      'cancelado': 'danger',
      'en_proceso': 'info',
      'asignada': 'info',
      'en_preparacion': 'warn',
      'en_entrega': 'warn',
      'completado': 'success',
      'completada': 'success',
      'pendiente': 'secondary',
      'en_ruta': 'warn'
    };
    return severityMap[status] || 'secondary';
  }
}
