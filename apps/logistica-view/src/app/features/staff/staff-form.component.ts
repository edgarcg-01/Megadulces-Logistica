import { Component, OnInit, inject, signal, output, DestroyRef, input, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar';
import { PopoverModule } from 'primeng/popover';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StaffService } from '../../core/services/logistics.service';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    InputNumberModule,
    SelectModule,
    CalendarModule,
    PopoverModule,
    IconComponent
  ],
  template: `
    <div class="flex h-full min-h-0 flex-col bg-surface-card">
      <form [formGroup]="staffForm" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-3">
        <div class="mb-2 flex items-center justify-between rounded-lg border border-divider bg-surface-ground px-3 py-1.5">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-md border border-divider bg-surface-card">
              <app-icon name="user-plus" size="sm" class="text-brand"></app-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-black text-content-main leading-tight uppercase tracking-wider">
                  {{ personToEdit() ? 'Editar Colaborador' : 'Nuevo Colaborador' }}
                </p>
                <p-button 
                  icon="pi pi-question-circle" 
                  [text]="true" 
                  severity="secondary" 
                  styleClass="p-0 h-4 w-4" 
                  (click)="op.toggle($event)" />
              </div>
              <p class="text-[10px] text-content-muted leading-tight uppercase font-bold tracking-tighter">Gestión de capital humano y control de licencias</p>
            </div>

            <p-popover #op>
              <div class="p-3 w-72">
                <div class="flex items-center gap-2 mb-2">
                  <app-icon name="info-circle" size="sm" class="text-brand-orange"></app-icon>
                  <span class="font-bold text-sm">Ayuda de Personal</span>
                </div>
                <div class="text-xs leading-relaxed text-content-muted">
                  Registra los datos básicos y laborales del nuevo integrante del equipo.
                  <br><br>
                  <b>Puntos clave:</b>
                  <ul class="pl-4 mt-1 list-disc font-medium">
                    <li>Validar CURP y NSS para temas legales.</li>
                    <li>Asignar el puesto correcto para habilitar funciones.</li>
                    <li>Cargar vigencia de licencia (obligatorio para choferes).</li>
                  </ul>
                </div>
              </div>
            </p-popover>
          </div>
          <p-button
            type="button"
            severity="secondary"
            [text]="true"
            styleClass="h-7 w-7"
            (onClick)="canceled.emit()">
            <ng-template pTemplate="icon">
              <app-icon name="close" size="sm"></app-icon>
            </ng-template>
          </p-button>
        </div>

        @if (submitError()) {
          <div class="mb-4 rounded-lg border border-red-400/40 bg-red-100/40 px-4 py-3 text-sm text-content-main font-bold">
            <app-icon name="exclamation-triangle" size="sm" class="mr-2"></app-icon>{{ submitError() }}
          </div>
        }

        <div class="shipment-fit-screen grid h-full grid-cols-12 gap-3">
          
          <!-- COLUMNA IZQUIERDA -->
          <div class="col-span-9 space-y-3 overflow-y-auto pr-2 shipment-scroll-column">
            
            <!-- Información Personal -->
            <div class="card-premium p-4 border-2">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                <app-icon name="id-card" size="md" class="text-content-main"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-sm">Información Personal</span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="flex flex-col gap-1">
                  <label for="nombre" class="text-label mb-1">Nombre(s) <span class="text-red-500">*</span></label>
                  <input pInputText formControlName="nombre" id="nombre" placeholder="Ej: Juan" class="w-full text-base font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="apellido_paterno" class="text-label mb-1">Apellido Paterno <span class="text-red-500">*</span></label>
                  <input pInputText formControlName="apellido_paterno" id="apellido_paterno" class="w-full text-base font-bold" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="apellido_materno" class="text-label mb-1">Apellido Materno</label>
                  <input pInputText formControlName="apellido_materno" id="apellido_materno" class="w-full text-base" />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="telefono" class="text-label mb-1">Teléfono Móvil</label>
                  <p-inputMask mask="(999) 999-9999" formControlName="telefono" placeholder="(000) 000-0000" styleClass="w-full text-base font-mono" />
                </div>
                <div class="col-span-2 flex flex-col gap-1">
                  <label for="email" class="text-label mb-1">Correo Electrónico</label>
                  <input pInputText formControlName="email" id="email" placeholder="ejemplo@megadulces.com" class="w-full text-base" />
                </div>

                <div class="col-span-3 flex flex-col gap-1">
                  <label for="curp" class="text-label mb-1">CURP Oficial</label>
                  <input pInputText formControlName="curp" id="curp" placeholder="Ingrese 18 caracteres..." class="w-full font-mono text-sm uppercase tracking-widest" />
                </div>
              </div>
            </div>

            <!-- Información Laboral -->
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                <app-icon name="briefcase" size="md" class="text-content-main"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-sm">Información Laboral</span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="flex flex-col gap-1">
                  <label for="puesto" class="text-label mb-1">Puesto Asignado <span class="text-red-500">*</span></label>
                  <p-select formControlName="puesto" id="puesto" [options]="puestoOptions" optionLabel="label" optionValue="value" 
                    placeholder="Seleccionar..." styleClass="w-full" [appendTo]="'body'" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="tipo" class="text-label mb-1">Tipo de Contrato</label>
                  <p-select formControlName="tipo" id="tipo" [options]="tipoOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="estado" class="text-label mb-1">Estado de Alta</label>
                  <p-select formControlName="estado" id="estado" [options]="estadoOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="fecha_ingreso" class="text-label mb-1">Fecha de Ingreso</label>
                  <p-calendar formControlName="fecha_ingreso" id="fecha_ingreso" [showIcon]="true" styleClass="w-full" [appendTo]="'body'" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="nss" class="text-label mb-1">Número de Seguro Social</label>
                  <input pInputText formControlName="nss" id="nss" class="w-full font-mono" />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="salario_diario" class="text-label mb-1">Salario Diario ($)</label>
                  <p-inputNumber formControlName="salario_diario" id="salario_diario" mode="currency" currency="MXN" locale="es-MX" styleClass="w-full font-mono font-bold text-score-high" />
                </div>
              </div>
            </div>

            <!-- Licencia Choferes -->
            @if (esChofer()) {
              <div class="card-premium p-4 border-l-4 border-brand-orange animate-fade-in">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-divider">
                  <app-icon name="truck" size="md" class="text-brand-orange"></app-icon>
                  <span class="font-semibold text-content-main uppercase tracking-wide text-sm">Credenciales de Conducción</span>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="flex flex-col gap-1">
                    <label for="licencia" class="text-label mb-1">No. Licencia <span class="text-red-500">*</span></label>
                    <input pInputText formControlName="licencia" id="licencia" class="w-full font-bold" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="licencia_tipo" class="text-label mb-1">Categoría</label>
                    <p-select formControlName="licencia_tipo" id="licencia_tipo" [options]="licenciaTipoOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="licencia_vigencia" class="text-label mb-1">Vigencia <span class="text-red-500">*</span></label>
                    <p-calendar formControlName="licencia_vigencia" id="licencia_vigencia" [showIcon]="true" styleClass="w-full" [appendTo]="'body'" />
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- COLUMNA DERECHA -->
          <div class="col-span-3 space-y-3">
            <div class="card-premium sticky top-0 flex min-h-[35rem] flex-col p-4 bg-surface-ground/30">
              <div class="flex items-center gap-2 mb-5 pb-3 border-b border-divider">
                <app-icon name="user-circle" size="lg" class="text-content-main"></app-icon>
                <span class="font-semibold text-content-main uppercase tracking-wide text-sm">Perfil del Colaborador</span>
              </div>

              <div class="space-y-3">
                <div class="flex flex-col items-center p-4 bg-surface-card border border-divider rounded-xl mb-2">
                  <div class="h-16 w-16 rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center mb-3">
                    <span class="text-2xl font-black text-brand">{{ (staffForm.get('nombre')?.value || '?')[0] }}{{ (staffForm.get('apellido_paterno')?.value || '?')[0] }}</span>
                  </div>
                  <p class="text-sm font-black text-content-main uppercase truncate w-full text-center">
                    {{ staffForm.get('nombre')?.value || 'NUEVO' }} {{ staffForm.get('apellido_paterno')?.value || 'INGRESO' }}
                  </p>
                  <p class="text-[10px] font-bold text-content-muted uppercase tracking-tighter">{{ staffForm.get('puesto')?.value || 'SIN PUESTO' }}</p>
                </div>

                <div class="flex justify-between items-center p-3 bg-surface-card border border-divider rounded-xl">
                  <span class="text-[10px] font-black uppercase text-content-muted">Estado</span>
                  <span class="status-chip status-{{ staffForm.get('estado')?.value }} !text-[10px]">
                    {{ staffForm.get('estado')?.value || 'ACTIVO' }}
                  </span>
                </div>

                <div class="flex justify-between items-center p-3 bg-surface-card border border-divider rounded-xl">
                  <span class="text-[10px] font-black uppercase text-content-muted">Contrato</span>
                  <span class="text-xs font-black text-content-main uppercase">
                    {{ staffForm.get('tipo')?.value || 'INTERNO' }}
                  </span>
                </div>
              </div>

              <!-- Warning de Licencia -->
              @if (getLicenseWarning()) {
                <div class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 animate-pulse">
                  <div class="flex items-start gap-2">
                    <app-icon name="alert-circle" size="sm" class="text-amber-600 mt-0.5"></app-icon>
                    <div>
                      <p class="text-[10px] font-black text-amber-900 uppercase">Estado de Licencia</p>
                      <p class="mt-0.5 text-[9px] font-bold text-amber-700 leading-tight">
                        {{ getLicenseWarning() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- Info Box Premium -->
              <div class="mt-auto mb-4 rounded-xl border border-divider bg-surface-card p-3">
                <div class="flex items-start gap-2">
                  <app-icon [name]="staffForm.valid ? 'check-circle' : 'exclamation-circle'" size="sm" 
                    [class]="staffForm.valid ? 'text-green-500' : 'text-amber-500'" class="mt-0.5"></app-icon>
                  <div>
                    <p class="text-xs font-black text-content-main uppercase tracking-tight">
                      {{ staffForm.valid ? 'Expediente Completo' : 'Campos Pendientes' }}
                    </p>
                    <p class="mt-0.5 text-[9px] font-medium text-content-muted leading-tight">
                      {{ staffForm.valid ? 'El colaborador puede ser dado de alta.' : 'Verifica los campos obligatorios (*) y licencias.' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <p-button
                  type="button"
                  label="Cancelar"
                  severity="secondary"
                  [outlined]="true"
                  styleClass="w-full py-2 text-xs font-bold uppercase transition-all hover:bg-surface-hover"
                  (onClick)="canceled.emit()" />
                <p-button
                  type="submit"
                  [label]="saving() ? 'Procesando...' : (personToEdit() ? 'Guardar Cambios' : 'Dar de Alta')"
                  styleClass="w-full p-button-brand py-4 text-xs font-black uppercase tracking-widest"
                  [loading]="saving()"
                  [disabled]="staffForm.invalid || saving()" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class StaffFormComponent implements OnInit {
  personToEdit = input<any>(null);
  saved = output<void>();
  canceled = output<void>();

  private fb = inject(FormBuilder);
  private staffService = inject(StaffService);
  private destroyRef = inject(DestroyRef);

  staffForm: FormGroup;

  // Opciones de dropdowns (readonly para evitar recreación en cada change detection)
  readonly puestoOptions = [
    { label: 'Chofer', value: 'Chofer' },
    { label: 'Operador', value: 'Operador' },
    { label: 'Ayudante', value: 'Ayudante' },
    { label: 'Cargador', value: 'Cargador' },
    { label: 'Supervisor', value: 'Supervisor' }
  ];

  readonly tipoOptions = [
    { label: 'Interno', value: 'interno' },
    { label: 'Externo', value: 'externo' }
  ];

  readonly estadoOptions = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Suspendido', value: 'suspendido' }
  ];

  readonly licenciaTipoOptions = [
    { label: 'Federal', value: 'Federal' },
    { label: 'Estatal', value: 'Estatal' },
    { label: 'Tipo A', value: 'A' },
    { label: 'Tipo B', value: 'B' },
    { label: 'Tipo C', value: 'C' },
    { label: 'Tipo D', value: 'D' }
  ];

  saving = signal(false);
  submitError = signal<string | null>(null);
  hoy = new Date();

  constructor() {
    this.staffForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido_paterno: ['', Validators.required],
      apellido_materno: [''],
      telefono: [''],
      email: [''],
      curp: [''],
      puesto: ['', Validators.required],
      tipo: ['interno'],
      estado: ['activo'],
      fecha_ingreso: [new Date()],
      nss: [''],
      salario_diario: [''],
      licencia: [''],
      licencia_tipo: ['Federal'],
      licencia_vigencia: [null]
    });

    // Escuchar cambios en puesto para mostrar/ocultar campos de licencia
    this.staffForm.get('puesto')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.updateLicenciaValidators();
    });

    // Efecto para cargar datos del colaborador en modo edición
    effect(() => {
      const person = this.personToEdit();
      if (person) {
        this.staffForm.patchValue({
          ...person,
          puesto: person.roles?.[0] || 'Ayudante', // Mapeo simple de rol a puesto
          fecha_ingreso: person.fecha_ingreso ? new Date(person.fecha_ingreso) : new Date(),
          licencia_vigencia: person.licencia_vigencia ? new Date(person.licencia_vigencia) : null
        });
        this.updateLicenciaValidators();
      } else {
        this.staffForm.reset({
          tipo: 'interno',
          estado: 'activo',
          fecha_ingreso: new Date()
        });
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.updateLicenciaValidators();
  }

  esChofer(): boolean {
    const puesto = this.staffForm.get('puesto')?.value;
    return puesto === 'Chofer' || puesto === 'Operador';
  }

  updateLicenciaValidators() {
    const licenciaControl = this.staffForm.get('licencia');
    const vigenciaControl = this.staffForm.get('licencia_vigencia');
    
    if (this.esChofer()) {
      licenciaControl?.setValidators([Validators.required]);
      vigenciaControl?.setValidators([Validators.required]);
    } else {
      licenciaControl?.clearValidators();
      vigenciaControl?.clearValidators();
    }
    
    licenciaControl?.updateValueAndValidity();
    vigenciaControl?.updateValueAndValidity();
  }

  isInvalid(field: string): boolean {
    const control = this.staffForm.get(field);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  getLicenseWarning(): string | null {
    if (!this.esChofer()) return null;

    const vigencia = this.staffForm.get('licencia_vigencia')?.value;
    if (!vigencia) return null;

    const hoy = new Date();
    const vigenciaDate = new Date(vigencia);
    const diffDays = Math.ceil((vigenciaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `⚠️ La licencia está vencida desde hace ${Math.abs(diffDays)} días`;
    }

    if (diffDays <= 30) {
      return `⚠️ La licencia vence en ${diffDays} días`;
    }

    return null;
  }

  onSubmit() {
    if (this.staffForm.invalid || this.saving()) return;

    this.saving.set(true);
    this.submitError.set(null);

    const person = this.personToEdit();
    const data = this.staffForm.value;

    const request = person 
      ? this.staffService.update(person.id, data)
      : this.staffService.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.submitError.set(err.message || 'Error al procesar la solicitud');
      }
    });
  }
}

// StaffFormComponent exportado
