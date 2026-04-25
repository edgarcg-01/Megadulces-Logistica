import { Component, OnInit, inject, signal, DestroyRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ShipmentsService } from '../../core/services/logistics.service';
import { ShipmentFormComponent } from './shipment-form.component';
import { SHIPMENT_STATUS } from '../../core/models/logistics.models';

interface Shipment {
  id: number;
  folio: string;
  fecha: string;
  origen: string;
  destino: string;
  unidad_placa: string;
  tipo_vehiculo?: 'camion' | 'camioneta' | 'auto';
  operador_nombre: string;
  estado: string;
  flete: number;
  km: number;
}

interface StatusOption {
  value: string | null;
  label: string;
}

interface KPI {
  label: string;
  value: number | string;
  trend?: string;
  color: 'brand' | 'orange' | 'green' | 'red';
}

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    TooltipModule,
    ChipModule,
    IconComponent,
    ShipmentFormComponent
  ],
  template: `
    <div class="w-full space-y-4 animate-fade-in-up">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-headline text-content-main">Embarques</h1>
          <p class="text-body text-content-muted mt-1">Gestión de embarques y rutas</p>
        </div>
        <p-button
          label="Nuevo Embarque"
          icon="pi pi-plus"
          styleClass="p-button-brand"
          (onClick)="openForm()" />
      </div>

      <!-- KPIs -->
      <div class="relative grid grid-cols-4 gap-3">
        <div class="kpi-card-trace kpi-card-trace-0 p-4">
          <div class="flex flex-col items-center justify-center">
            <app-icon name="truck" size="lg" class="text-content-main mb-1"></app-icon>
            <p class="text-label-xs text-content-muted text-center mb-1">Total Hoy</p>
            <p class="text-xl font-black text-content-main text-center">{{ kpis().total }}</p>
          </div>
        </div>

        <div class="kpi-card-trace kpi-card-trace-1 p-4">
          <div class="flex flex-col items-center justify-center">
            <app-icon name="clock" size="lg" class="text-content-main mb-1"></app-icon>
            <p class="text-label-xs text-content-muted text-center mb-1">Programados</p>
            <p class="text-xl font-black text-blue-600 text-center">{{ kpis().programados }}</p>
          </div>
        </div>

        <div class="kpi-card-trace kpi-card-trace-2 p-4">
          <div class="flex flex-col items-center justify-center">
            <app-icon name="refresh" size="lg" class="text-content-main mb-1"></app-icon>
            <p class="text-label-xs text-content-muted text-center mb-1">En Tránsito</p>
            <p class="text-xl font-black text-amber-500 text-center">{{ kpis().transito }}</p>
          </div>
        </div>

        <div class="kpi-card-trace kpi-card-trace-3 p-4">
          <div class="flex flex-col items-center justify-center">
            <app-icon name="check-circle" size="lg" class="text-content-main mb-1"></app-icon>
            <p class="text-label-xs text-content-muted text-center mb-1">Completados</p>
            <p class="text-xl font-black text-green-600 text-center">{{ kpis().completados }}</p>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card-premium overflow-hidden">
        <!-- Toolbar -->
        <div class="flex items-center justify-between p-3 border-b border-divider bg-surface-ground/50">
          <div class="flex items-center gap-3">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search" />
              <input 
                pInputText 
                type="text" 
                [(ngModel)]="searchTerm"
                (input)="onSearch($event)"
                placeholder="Buscar por folio, destino o chofer..."
                class="w-80" />
            </p-iconField>
            
            <p-select 
              [(ngModel)]="selectedStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              (onChange)="onStatusChange($event)"
              placeholder="Filtrar estado"
              styleClass="w-48" />
          </div>

          <div class="flex items-center gap-2">
            <p-button
              icon="pi pi-filter-slash"
              severity="secondary"
              [text]="true"
              size="small"
              styleClass="action-clear"
              (onClick)="clearFilters()"
              pTooltip="Limpiar filtros" />
            <p-button
              icon="pi pi-download"
              severity="secondary"
              [text]="true"
              size="small"
              styleClass="action-export"
              (onClick)="exportData()"
              pTooltip="Exportar Excel" />
          </div>
        </div>

        <!-- Table -->
        <p-table
          #dt
          [value]="shipments()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [loading]="loading()"
          [globalFilterFields]="['folio', 'destino', 'unidad_placa', 'operador_nombre']"
          styleClass="p-datatable-modern"
          [rowHover]="true"
          dataKey="id">          <ng-template #header>
            <tr>
              <th class="w-24 text-center text-label">Folio</th>
              <th class="w-28 text-center text-label">Fecha</th>
              <th style="width: 1%" class="text-center text-label">Ruta</th>
              <th class="w-32 text-center text-label">Unidad</th>
              <th class="w-32 text-center text-label">Operador</th>
              <th class="w-24 text-center text-label">Estado</th>
              <th class="w-28 text-right text-label">Flete</th>
              <th class="w-20 text-center text-label">Acciones</th>
            </tr>
          </ng-template>

          <ng-template #body let-shipment>
            <tr class="hover-lift">
              <td class="text-center">
                <span class="folio-badge">{{ shipment.folio }}</span>
              </td>
              <td class="text-center text-xs">{{ shipment.fecha | date:'dd/MM/yy' }}</td>
              <td class="text-center">
                <div class="flex flex-col items-center whitespace-nowrap">
                  <span class="font-semibold text-sm">{{ shipment.origen }} → {{ shipment.destino }}</span>
                  <span class="text-[10px] text-content-faint uppercase font-bold">{{ shipment.km }} km a recorrer</span>
                </div>
              </td>
              <td class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <app-icon [name]="getVehicleIconName(shipment.tipo_vehiculo)" size="sm" class="text-content-faint"></app-icon>
                  <span class="text-sm">{{ shipment.unidad_placa }}</span>
                </div>
              </td>
              <td class="text-center text-sm">{{ shipment.operador_nombre }}</td>
              <td class="text-center">
                <p-tag
                  [value]="getStatusLabel(normalizeStatus(shipment.estado))"
                  [styleClass]="'text-[10px] uppercase font-bold status-chip status-' + normalizeStatus(shipment.estado)"
                  [severity]="getStatusSeverity(normalizeStatus(shipment.estado))" />
              </td>
              <td class="text-right">
                <p-chip
                  [label]="(shipment.flete | currency:'MXN':'symbol':'1.0-0') || ''"
                  styleClass="flete-chip" />
              </td>
              <td class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <p-button
                    icon="pi pi-eye"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    styleClass="action-view"
                    (onClick)="viewShipment(shipment)"
                    pTooltip="Ver detalle" />
                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    styleClass="action-edit"
                    (onClick)="editShipment(shipment)"
                    pTooltip="Editar" />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-12">
                <div class="flex flex-col items-center gap-3">
                  <app-icon name="database" size="xl" class="text-content-faint"></app-icon>
                  <span class="text-label text-content-faint">No se encontraron embarques registrados</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- New Shipment Dialog -->
      <p-dialog
        [visible]="showForm()"
        (visibleChange)="showForm.set($event)"
        [modal]="true"
        [style]="{width: '100vw', height: '100vh', margin: '0', 'max-height': '100vh'}"
        [contentStyle]="{height: 'calc(100vh - 3.5rem)', padding: '0', overflow: 'hidden'}"
        [dismissableMask]="true"
        [draggable]="false"
        [resizable]="false"
        [maximizable]="false"
        [appendTo]="'body'"
        [closable]="false"
        [showHeader]="false"
        styleClass="shipment-dialog shipment-dialog-fullscreen">
        <app-shipment-form
          (saved)="onShipmentSaved($event)"
          (canceled)="showForm.set(false)" />
      </p-dialog>

      <!-- Success Dialog - Next Steps -->
      <p-dialog
        [(visible)]="showSuccessDialog"
        [modal]="true"
        [style]="{width: '500px'}"
        [breakpoints]="{'960px': '90vw'}"
        [draggable]="false"
        [resizable]="false"
        [closable]="false"
        [showHeader]="false"
        styleClass="success-dialog">
        <div class="p-6 text-center">
          <!-- Success Icon -->
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <app-icon name="check-circle" size="xl" class="text-green-600"></app-icon>
          </div>

          <h2 class="text-xl font-bold text-content-main mb-2">¡Embarque Registrado!</h2>
          <p class="text-sm text-content-muted mb-4">
            El embarque <strong>{{ lastCreatedShipment()?.folio }}</strong> ha sido creado exitosamente con estado <strong>Programado</strong>.
          </p>

          <div class="mb-6 p-4 bg-surface-ground rounded-lg border border-divider">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-left">
                <span class="text-content-muted text-xs uppercase">Ruta:</span>
                <p class="font-medium">{{ lastCreatedShipment()?.origen }} → {{ lastCreatedShipment()?.destino }}</p>
              </div>
              <div class="text-left">
                <span class="text-content-muted text-xs uppercase">Flete:</span>
                <p class="font-medium text-green-600">{{ lastCreatedShipment()?.flete | currency:'MXN' }}</p>
              </div>
            </div>
          </div>

          <p class="text-sm font-medium text-content-main mb-4">¿Qué deseas hacer ahora?</p>

          <div class="flex flex-col gap-3">
            <p-button
              label="Crear Guía de Viaje"
              icon="pi pi-file-edit"
              styleClass="p-button-brand w-full"
              (onClick)="goToGuide()" />
            <p-button
              label="Registrar Costos (Cierre)"
              icon="pi pi-calculator"
              severity="secondary"
              styleClass="w-full"
              (onClick)="goToCosts()" />
            <p-button
              label="Solo Cerrar"
              icon="pi pi-check"
              [text]="true"
              severity="secondary"
              styleClass="w-full"
              (onClick)="closeSuccessDialog()" />
          </div>
        </div>
      </p-dialog>

      <!-- Shipment Detail Dialog -->
      <p-dialog 
        header="Detalle de Embarque" 
        [(visible)]="displayDetail" 
        [modal]="true" 
        [style]="{width: '700px'}" 
        [breakpoints]="{'960px': '75vw', '640px': '95vw'}"
        [draggable]="false" 
        [resizable]="false">
        <div *ngIf="selectedShipmentDetail(); let detail" class="space-y-6 py-2">
            <!-- Header Info -->
            <div class="flex justify-between items-start border-b border-divider pb-4">
                <div>
                    <h2 class="text-xl font-bold text-content-main">{{ detail.folio }}</h2>
                    <p class="text-sm text-content-muted">{{ detail.fecha | date:'fullDate' }}</p>
                </div>
                <div class="text-right">
                    <p-tag 
                        [value]="getStatusLabel(normalizeStatus(detail.estado))" 
                        [severity]="getStatusSeverity(normalizeStatus(detail.estado))" />
                </div>
            </div>

            <!-- Route & Grid Info -->
            <div class="grid grid-cols-2 gap-6">
                <div class="space-y-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-content-faint">Ruta y Carga</h3>
                    <div class="bg-surface-ground p-3 rounded-xl space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Origen:</span>
                            <span class="font-medium">{{ detail.origen }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Destino:</span>
                            <span class="font-medium">{{ detail.destino }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Distancia:</span>
                            <span class="font-medium">{{ detail.km }} km</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Peso:</span>
                            <span class="font-medium">{{ detail.peso }} kg</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Cajas:</span>
                            <span class="font-medium">{{ detail.cajas }}</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-content-faint">Finanzas</h3>
                    <div class="bg-surface-ground p-3 rounded-xl space-y-2 border-l-4 border-emerald-500">
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Flete:</span>
                            <span class="font-bold text-emerald-600">{{ detail.flete | currency:'MXN' }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-content-muted">Valor Carga:</span>
                            <span class="font-medium">{{ detail.valor_carga | currency:'MXN' }}</span>
                        </div>
                        <div *ngIf="detail.costs" class="pt-2 mt-2 border-t border-divider space-y-1">
                            <div class="flex justify-between text-[11px]">
                                <span class="text-content-muted">Combustible:</span>
                                <span>{{ detail.costs.combustible | currency:'MXN' }}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-content-muted">Casetas:</span>
                                <span>{{ detail.costs.casetas | currency:'MXN' }}</span>
                            </div>
                            <div class="flex justify-between text-[11px] font-bold">
                                <span class="text-content-muted text-[10px]">TOTAL COSTOS:</span>
                                <span>{{ detail.costs.total | currency:'MXN' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Participants -->
            <div class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-content-faint">Participantes</h3>
                <div class="grid grid-cols-1 gap-2">
                    <div *ngFor="let c of detail.carga" class="flex items-center justify-between bg-surface-ground/50 p-2 rounded-lg border border-divider">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span class="text-xs font-medium">CARGA</span>
                        </div>
                        <span class="text-xs italic">{{ c.colaborador_nombre || 'Colaborador' }}</span>
                        <span class="text-xs font-bold">{{ c.tarifa | currency:'MXN' }}</span>
                    </div>
                    <div *ngFor="let d of detail.descarga" class="flex items-center justify-between bg-surface-ground/50 p-2 rounded-lg border border-divider">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full" [ngClass]="d.tipo === 'regreso' ? 'bg-orange-500' : 'bg-purple-500'"></div>
                            <span class="text-xs font-medium uppercase">{{ d.tipo }}</span>
                        </div>
                        <span class="text-xs italic">{{ d.colaborador_nombre || 'Colaborador' }}</span>
                        <span class="text-xs font-bold">{{ d.monto | currency:'MXN' }}</span>
                    </div>
                </div>
            </div>

            <!-- Observations -->
            <div *ngIf="detail.observaciones" class="space-y-1">
                <h3 class="text-xs font-bold uppercase tracking-wider text-content-faint">Observaciones</h3>
                <p class="text-sm italic text-content-muted bg-surface-lowest p-3 rounded-lg border-l-4 border-divider">
                    "{{ detail.observaciones }}"
                </p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4">
                <p-button 
                    icon="pi pi-download" 
                    label="Descargar PDF" 
                    severity="secondary" 
                    [text]="true"
                    (onClick)="downloadPdf(detail)" />
                <p-button 
                    icon="pi pi-check" 
                    label="Cerrar" 
                    styleClass="p-button-brand"
                    (onClick)="displayDetail = false" />
            </div>
        </div>
        <div *ngIf="loadingDetail()" class="flex flex-col items-center justify-center py-12 gap-3">
            <i class="pi pi-spin pi-spinner text-4xl text-content-faint"></i>
            <span class="text-label text-content-faint">Cargando detalles...</span>
        </div>
      </p-dialog>
    </div>
  `
})
export class ShipmentsComponent implements OnInit {
  private shipmentsService = inject(ShipmentsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  shipments = signal<Shipment[]>([]);
  loading = signal(true);
  showForm = signal(false);
  displayDetail = false;
  selectedShipmentDetail = signal<any | null>(null);
  loadingDetail = signal(false);
  hoveredKpi = signal(-1);
  kpiVisible = signal(false);

  // Success dialog after creating shipment
  showSuccessDialog = signal(false);
  lastCreatedShipment = signal<any | null>(null);
  
  // KPI slider timer
  private kpiTimer: any;
  
  kpis = signal({
    total: 0,
    programados: 0,
    transito: 0,
    completados: 0
  });

  // KPI slider methods
  onKpiEnter(index: number) {
    clearTimeout(this.kpiTimer);
    this.kpiVisible.set(false);
    this.kpiTimer = setTimeout(() => {
      this.hoveredKpi.set(index);
      this.kpiVisible.set(true);
    }, 120);
  }

  onKpiLeave() {
    clearTimeout(this.kpiTimer);
    this.kpiVisible.set(false);
    this.kpiTimer = setTimeout(() => {
      this.hoveredKpi.set(-1);
    }, 120);
  }

  // Filters
  @ViewChild('dt') dt!: Table;
  searchTerm = '';
  selectedStatus: string | null = null;
  statusOptions: StatusOption[] = [
    { label: 'Todos', value: null }
  ];

  ngOnInit() {
    this.loadShipments();
    this.loadStatuses();
  }

  loadStatuses() {
    this.shipmentsService.getStatuses().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (statuses) => {
        this.statusOptions = [
          { label: 'Todos', value: null },
          ...statuses.map((s: any) => ({
            label: s.label,
            value: s.value
          }))
        ];
      },
      error: () => {
        // Fallback to default statuses if API fails
        this.statusOptions = [
          { label: 'Todos', value: null },
          { label: 'Programados', value: SHIPMENT_STATUS.PROGRAMADO },
          { label: 'En Tránsito', value: SHIPMENT_STATUS.EN_TRANSITO },
          { label: 'Completados', value: SHIPMENT_STATUS.COMPLETADO },
          { label: 'Cancelados', value: SHIPMENT_STATUS.CANCELADO }
        ];
      }
    });
  }

  loadShipments() {
    this.loading.set(true);
    this.shipmentsService.findAll().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.shipments.set(data);
        this.calculateKPIs(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
      }
    });
  }

  calculateKPIs(data: Shipment[]) {
    const today = new Date().toISOString().split('T')[0];
    const todayShipments = data.filter(s => {
      const shipmentDate = new Date(s.fecha).toISOString().split('T')[0];
      return shipmentDate === today;
    });
    
    this.kpis.set({
      total: todayShipments.length,
      programados: data.filter(s => s.estado === 'programado').length,
      transito: data.filter(s => s.estado === 'transito').length,
      completados: data.filter(s => s.estado === 'completado').length
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [SHIPMENT_STATUS.PROGRAMADO]: 'info',
      [SHIPMENT_STATUS.EN_TRANSITO]: 'warn',
      [SHIPMENT_STATUS.COMPLETADO]: 'success',
      [SHIPMENT_STATUS.CANCELADO]: 'danger'
    };
    return map[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      [SHIPMENT_STATUS.PROGRAMADO]: 'Programado',
      [SHIPMENT_STATUS.EN_TRANSITO]: 'En Tránsito',
      [SHIPMENT_STATUS.COMPLETADO]: 'Completado',
      [SHIPMENT_STATUS.CANCELADO]: 'Cancelado'
    };
    return map[status] || status;
  }

  normalizeStatus(status: string): string {
    // Normalizar estado para asegurar consistencia
    const statusLower = status.toLowerCase().replace(/ /g, '_');
    const statusMap: Record<string, string> = {
      'programado': SHIPMENT_STATUS.PROGRAMADO,
      'transito': SHIPMENT_STATUS.EN_TRANSITO,
      'en_transito': SHIPMENT_STATUS.EN_TRANSITO,
      'en tránsito': SHIPMENT_STATUS.EN_TRANSITO,
      'completado': SHIPMENT_STATUS.COMPLETADO,
      'entregado': SHIPMENT_STATUS.COMPLETADO,
      'cancelado': SHIPMENT_STATUS.CANCELADO
    };
    return statusMap[statusLower] || status;
  }

  getVehicleIconName(tipo?: string): string {
    const iconMap: Record<string, string> = {
      'camion': 'truck',
      'camioneta': 'truck',
      'auto': 'car'
    };
    return iconMap[tipo || ''] || 'truck';
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    if (this.dt) {
      this.dt.filterGlobal(this.searchTerm, 'contains');
    }
  }

  onStatusChange(event: any) {
    if (this.dt) {
      this.dt.filter(event.value, 'estado', 'equals');
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
  }

  exportData() {
    // TODO: Implementar exportación de datos
  }

  viewShipment(shipment: Shipment) {
    if (!shipment.id) return;
    
    this.loadingDetail.set(true);
    this.displayDetail = true;
    this.selectedShipmentDetail.set(null);

    this.shipmentsService.findOne(shipment.id.toString()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (detail) => {
        this.selectedShipmentDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.displayDetail = false;
      }
    });
  }

  editShipment(shipment: Shipment) {
    // TODO: Implementar edición en el mismo formulario
    console.log('Edit shipment', shipment);
  }

  downloadPdf(shipment: Shipment) {
    if (!shipment.id) return;
    
    this.shipmentsService.downloadPdf(shipment.id.toString()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `embarque-${shipment.folio}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        console.error('Error downloading PDF');
      }
    });
  }

  onShipmentSaved(shipmentData: any) {
    this.showForm.set(false);
    this.lastCreatedShipment.set(shipmentData);
    this.showSuccessDialog.set(true);
    this.loadShipments();
  }

  closeSuccessDialog() {
    this.showSuccessDialog.set(false);
    this.lastCreatedShipment.set(null);
  }

  goToGuide() {
    const shipment = this.lastCreatedShipment();
    if (shipment) {
      // Store the shipment data in sessionStorage for the guide form to pick up
      sessionStorage.setItem('prefill_guide_from_shipment', JSON.stringify({
        embarque_id: shipment.id,
        embarque_folio: shipment.folio,
        chofer_id: shipment.operador_id,
        chofer_nombre: shipment.operador_nombre,
        fecha_salida: shipment.fecha,
        km_salida: shipment.km
      }));
      this.showSuccessDialog.set(false);
      this.router.navigate(['/guides']);
    }
  }

  goToCosts() {
    const shipment = this.lastCreatedShipment();
    if (shipment) {
      // Store the shipment data in sessionStorage for the cost form to pick up
      sessionStorage.setItem('prefill_cost_from_shipment', JSON.stringify({
        embarque_id: shipment.id,
        embarque_folio: shipment.folio,
        km: shipment.km,
        flete: shipment.flete
      }));
      this.showSuccessDialog.set(false);
      this.router.navigate(['/costs']);
    }
  }

  openForm() {
    this.showForm.set(true);
  }
}
