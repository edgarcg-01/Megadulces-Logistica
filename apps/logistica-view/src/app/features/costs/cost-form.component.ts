import { Component, OnInit, inject, signal, output, DestroyRef, input, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CostsService, ShipmentsService } from '../../core/services/logistics.service';

@Component({
  selector: 'app-cost-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, 
    InputNumberModule, SelectModule, CalendarModule, TextareaModule, IconComponent
  ],
  template: `
    <div class="flex h-full min-h-0 flex-col bg-surface-card w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-2xl border border-divider">
      <form [formGroup]="costForm" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-4 md:p-6">
        
        <div class="mb-4 flex items-center justify-between border-b border-divider pb-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-divider bg-brand/10">
              <app-icon name="currency-dollar" size="md" class="text-brand"></app-icon>
            </div>
            <div>
              <h2 class="text-lg font-black text-content-main uppercase tracking-widest">
                {{ costToEdit() ? 'Editar Costo' : 'Registrar Costo de Embarque' }}
              </h2>
              <p class="text-xs text-content-muted uppercase tracking-wider font-bold">Control financiero por ruta</p>
            </div>
          </div>
          <p-button type="button" severity="secondary" [text]="true" icon="pi pi-times" (onClick)="canceled.emit()" />
        </div>

        @if (submitError()) {
          <div class="mb-4 rounded-lg border border-red-400/40 bg-red-100/40 px-4 py-3 text-sm text-content-main font-bold">
            <app-icon name="exclamation-triangle" size="sm" class="mr-2"></app-icon>{{ submitError() }}
          </div>
        }

        @if (shipments().length === 0 && !costToEdit()) {
          <div class="mb-4 rounded-lg border border-amber-400/40 bg-amber-100/40 px-4 py-3 text-sm text-content-main">
            <app-icon name="information-circle" size="sm" class="mr-2"></app-icon>
            <strong>No hay embarques disponibles.</strong> El chofer debe completar la ruta (checklist de llegada) antes de registrar costos.
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- DATOS GENERALES -->
          <div class="space-y-4">
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                <app-icon name="document-text" size="sm" class="text-content-main"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-xs">Datos Generales</span>
              </div>
              
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-label">Folio Embarque <span class="text-red-500">*</span></label>
                  <p-select 
                    formControlName="embarque_id" 
                    [options]="shipments()" 
                    optionLabel="folio" 
                    optionValue="id" 
                    placeholder="Seleccionar embarque..."
                    styleClass="w-full">
                    <ng-template pTemplate="selectedItem">
                      <div class="font-bold flex items-center gap-2" *ngIf="selectedShipmentDetails()">
                        {{ selectedShipmentDetails()?.folio }} 
                        <span class="text-[10px] text-content-muted bg-surface-ground px-1 rounded">{{ selectedShipmentDetails()?.unidad_placa }}</span>
                      </div>
                    </ng-template>
                    <ng-template let-ship pTemplate="item">
                      <div class="flex justify-between w-full">
                        <span class="font-bold">{{ ship.folio }}</span>
                        <span class="text-content-muted text-xs">{{ ship.fecha | date:'dd/MM/yy' }}</span>
                      </div>
                    </ng-template>
                  </p-select>
                </div>
              </div>

              <!-- Referencias extraídas del embarque -->
              @if (selectedShipmentDetails()) {
                <div class="mt-4 p-3 bg-surface-ground border border-divider rounded-lg grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span class="text-content-muted uppercase tracking-wider block text-[9px]">Distancia</span>
                    <span class="font-mono font-bold">{{ selectedShipmentDetails()?.km || 0 }} km</span>
                  </div>
                  <div>
                    <span class="text-content-muted uppercase tracking-wider block text-[9px]">Unidad</span>
                    <span class="font-mono font-bold">{{ selectedShipmentDetails()?.unidad_placa || 'N/A' }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- COSTOS FIJOS (Calculados) -->
            <div class="card-premium p-4 border-l-4 border-brand-orange">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                <app-icon name="calculator" size="sm" class="text-brand-orange"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-xs">Costo Fijo de Unidad</span>
              </div>
              <p class="text-[10px] text-content-muted mb-3 leading-tight">Calculado automáticamente prorrateando los km recorridos del embarque por el costo fijo catalogado de la unidad.</p>
              
              <div class="flex flex-col gap-1">
                <label class="text-label">Costo Fijo Total ($)</label>
                <p-inputNumber formControlName="costo_fijo_km" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold text-score-high" [readonly]="true" />
              </div>
            </div>
            
            <div class="card-premium p-4 bg-surface-ground/30">
              <div class="flex flex-col gap-1">
                <label class="text-label">Observaciones</label>
                <textarea pTextarea formControlName="observaciones" rows="3" class="w-full text-sm"></textarea>
              </div>
            </div>
          </div>

          <!-- COSTOS OPERATIVOS -->
          <div class="space-y-4">
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                <app-icon name="cash" size="sm" class="text-green-500"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-xs">Desglose Operativo de Ruta</span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-label">Viáticos (de Guía)</label>
                  <p-inputNumber formControlName="viaticos_guia" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold text-blue-500" [readonly]="true" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Combustible</label>
                  <p-inputNumber formControlName="combustible" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Casetas</label>
                  <p-inputNumber formControlName="casetas" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Pensiones</label>
                  <p-inputNumber formControlName="pensiones" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Talachas / Imprevistos</label>
                  <p-inputNumber formControlName="talachas" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Permisos</label>
                  <p-inputNumber formControlName="permisos" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Hospedaje</label>
                  <p-inputNumber formControlName="hospedaje" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Maniobras</label>
                  <p-inputNumber formControlName="maniobras" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Ayudantes Externos</label>
                  <p-inputNumber formControlName="ayudantes_ext" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-label">Otros</label>
                  <p-inputNumber formControlName="otros" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold" />
                </div>
              </div>

              <!-- RESUMEN EN VIVO -->
              <div class="mt-4 pt-3 border-t border-divider">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[10px] font-black uppercase tracking-widest text-content-muted">Subtotal Operativo</span>
                  <span class="font-mono text-xs font-bold">{{ costForm.get('subtotal_operativo')?.value | currency:'MXN' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs font-black uppercase tracking-widest text-brand">Costo Total Calculado</span>
                  <span class="font-mono text-lg font-black text-brand">{{ costForm.get('total')?.value | currency:'MXN' }}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-divider">
          <p-button type="button" label="Cancelar" severity="secondary" [outlined]="true" (onClick)="canceled.emit()" />
          <p-button type="submit" [label]="saving() ? 'Guardando...' : 'Guardar Costos'" styleClass="p-button-brand font-bold uppercase" [loading]="saving()" [disabled]="costForm.invalid || saving()" />
        </div>
      </form>
    </div>
  `
})
export class CostFormComponent implements OnInit {
  costToEdit = input<any>(null);
  prefillFromShipment = input<any>(null);
  saved = output<any>();
  canceled = output<void>();

  private fb = inject(FormBuilder);
  private costsService = inject(CostsService);
  private shipmentsService = inject(ShipmentsService);
  private destroyRef = inject(DestroyRef);

  costForm: FormGroup;
  shipments = signal<any[]>([]);
  selectedShipmentDetails = signal<any>(null);
  saving = signal(false);
  submitError = signal<string | null>(null);

  // Valor hardcodeado para la demo, debería venir del catálogo de la unidad
  private COSTO_UNITARIO_KM = 3.50; 

  constructor() {
    this.costForm = this.fb.group({
      embarque_id: ['', Validators.required],
      combustible: [0],
      casetas: [0],
      hospedaje: [0],
      pensiones: [0],
      permisos: [0],
      talachas: [0],
      ayudantes_ext: [0],
      maniobras: [0],
      viaticos_guia: [0],
      otros: [0],
      observaciones: [''],
      // Campos calculados
      subtotal_operativo: [{ value: 0, disabled: true }],
      costo_fijo_km: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });

    // Recalcular totales cada vez que cambia un campo monetario
    this.costForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((val) => {
      // Necesitamos evitar loops infinitos si modificamos los calculados, asi que lo hacemos manual
      this.recalculateTotals();
    });

    // Detectar selección de embarque
    this.costForm.get('embarque_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((id) => {
      if (id) {
        this.loadShipmentData(id);
      } else {
        this.selectedShipmentDetails.set(null);
      }
    });

    effect(() => {
      const cost = this.costToEdit();
      if (cost) {
        // En modo edición cargamos también la data específica para no perder el detalle del embarque
        this.costForm.patchValue({
          ...cost,
          embarque_id: cost.embarque_id // esto triggereará la carga del embarque via valueChanges
        }, { emitEvent: true });
      } else {
        this.costForm.reset({
          combustible: 0, casetas: 0, hospedaje: 0, pensiones: 0,
          permisos: 0, talachas: 0, ayudantes_ext: 0, maniobras: 0, viaticos_guia: 0, otros: 0
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const shipment = this.prefillFromShipment();
      if (shipment && shipment.embarque_id) {
        // Prefill the form with shipment data
        // The valueChanges on embarque_id will trigger loadShipmentData
        this.costForm.patchValue({
          embarque_id: shipment.embarque_id
        }, { emitEvent: true });
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Estados permitidos para registrar costos (chofer debe haber completado la ruta)
    const estadosPermitidos = ['checklist_llegada', 'costos_pendientes', 'completado'];

    this.shipmentsService.findAll().subscribe(data => {
      // Cargar costos existentes para filtrar embarques sin costos
      this.costsService.findAll().subscribe(costs => {
        const embarqueIdsConCostos = new Set(costs.map((c: any) => c.embarque_id));

        // Filtrar embarques que:
        // 1. No tengan costos registrados
        // 2. Estén en estados permitidos (chofer completó la ruta)
        const embarquesValidos = data.filter((s: any) => {
          const sinCostos = !embarqueIdsConCostos.has(s.id);
          const estadoValido = estadosPermitidos.includes(s.estado);
          return sinCostos && estadoValido;
        });

        this.shipments.set(embarquesValidos);

        // After shipments load, check if we need to prefill from a shipment
        const shipment = this.prefillFromShipment();
        if (shipment && shipment.embarque_id) {
          // Find the shipment in the loaded data
          const found = embarquesValidos.find((s: any) => s.id === shipment.embarque_id);
          if (found) {
            // Trigger the value change to load shipment data
            setTimeout(() => {
              this.costForm.patchValue({
                embarque_id: shipment.embarque_id
              }, { emitEvent: true });
            }, 0);
          }
        }
      });
    });
  }

  loadShipmentData(embarqueId: string) {
    const shipment = this.shipments().find(s => s.id === embarqueId);
    if (shipment) {
      this.selectedShipmentDetails.set(shipment);
      this.calculateFixedCosts(shipment.km);
      
      // Auto cargar viáticos si existen (simulación: asumiendo que vienen en el objeto o se consultan)
      // En la vida real harías: this.shipmentsService.findOne(embarqueId)
      this.shipmentsService.findOne(embarqueId).subscribe(res => {
        let viaticosTotal = 0;
        if (res.guias && res.guias.length > 0) {
           viaticosTotal = res.guias.reduce((acc: number, curr: any) => acc + Number(curr.viaticos_total || 0), 0);
        }
        
        this.costForm.patchValue({
          viaticos_guia: viaticosTotal
        }, { emitEvent: false }); // evitamo loop infinito
        this.recalculateTotals();
      });
    }
  }

  calculateFixedCosts(km: number) {
    const totalFijo = (km || 0) * this.COSTO_UNITARIO_KM;
    this.costForm.patchValue({
      costo_fijo_km: totalFijo
    }, { emitEvent: false });
    this.recalculateTotals();
  }

  recalculateTotals() {
    const vals = this.costForm.getRawValue();
    const opValues = [
      vals.combustible, vals.casetas, vals.hospedaje, vals.pensiones, 
      vals.permisos, vals.talachas, vals.ayudantes_ext, vals.maniobras, 
      vals.viaticos_guia, vals.otros
    ];
    
    const subtotalOp = opValues.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    const fijo = Number(vals.costo_fijo_km) || 0;
    const total = subtotalOp + fijo;

    // Actualizar controls sin disparar el evento valueChanges para evitar bucle
    this.costForm.get('subtotal_operativo')?.setValue(subtotalOp, { emitEvent: false });
    this.costForm.get('total')?.setValue(total, { emitEvent: false });
  }

  onSubmit() {
    if (this.costForm.invalid || this.saving()) return;

    this.saving.set(true);
    this.submitError.set(null);

    const cost = this.costToEdit();
    // getRawValue extrae también los disabled (subtotales) que necesitamos guardar en DB
    const data = this.costForm.getRawValue();

    const request = cost 
      ? this.costsService.update(cost.id, data)
      : this.costsService.create(data);

    request.subscribe({
      next: (savedCost) => {
        this.saving.set(false);
        this.saved.emit(savedCost);
      },
      error: (err) => {
        this.saving.set(false);
        this.submitError.set(err.error?.message || err.message || 'Error al procesar el costo');
      }
    });
  }
}
