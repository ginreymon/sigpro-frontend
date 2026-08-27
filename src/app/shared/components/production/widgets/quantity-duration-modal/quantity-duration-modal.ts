import { Component, effect, Input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiHourInput } from '../../../../elements/ui-hour-input/ui-hour-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { TimeRangeFields } from '../../../form-controls/time-range-fields/time-range-fields';
import { SkuDetail } from '../../cards/sku-detail/sku-detail';
import { SkuQuantitySummary } from '../../cards/sku-quantity-summary/sku-quantity-summary';
import { QuantityDetail } from '../../cards/quantity-detail/quantity-detail';
import { SkuQuantityCounter } from '../../cards/sku-quantity-counter/sku-quantity-counter';
import { TabItem, UiTabs } from '../../../../elements/ui-tabs/ui-tabs';
import { QuantityModal } from '../../modals/quantity-modal/quantity-modal';
import { ProductionRecord } from '../../../../../models/production/production-record';
import {
  durationMinutesBetween,
  timeMinusMinutes,
  toLocalDate as toLocalDateUtil,
} from '../../../../../common/functions/time-range';

// Variante de app-quantity-modal para módulos con
// allows_manual_duration_entry=true (apps/production/models/module.py):
// hereda todo el comportamiento de cantidades tal cual y solo agrega, en una
// pestaña aparte que va primero, la hora de inicio/fin — obligatoria para un
// registro nuevo. La pestaña Cantidades no se puede abrir hasta completarla.
// El componente a usar se decide en el llamador según ese flag — este no
// vuelve a comprobarlo.
@Component({
  selector: 'app-quantity-duration-modal',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiFormField, UiLargeInput, UiHourInput, TimeRangeFields, ReactiveFormsModule, SkuDetail,
    SkuQuantitySummary, UiErrorMessage, QuantityDetail, SkuQuantityCounter, UiTabs, DatePipe,
  ],
  templateUrl: './quantity-duration-modal.html',
})
export class QuantityDurationModal extends QuantityModal {
  protected tabs: TabItem[] = [
    { key: 'horario', label: 'Horario' },
    { key: 'quantities', label: 'Cantidades' },
  ];
  protected activeTab = signal('horario');

  // Hora de inicio del turno activo ("HH:mm:ss" o "HH:mm") — la hora
  // inicial del registro manual no puede ser anterior a esto. La pasa el
  // llamador (shift-cycles: context()?.session?.work_shift?.start_time).
  @Input() shiftStartTime: string | null = null;

  constructor() {
    super();

    this.recordForm.addControl('start_time', this.fb.control(null));
    this.recordForm.addControl('end_time', this.fb.control(null));
    this.recordForm.addControl('duration_minutes', this.fb.control<number | null>(null));

    // La hora es obligatoria solo al crear — en modo edición ya está fijada
    // (no se vuelve a pedir). editMode() es un signal real, así que un
    // effect() sí reacciona a sus cambios (a diferencia de un valueChanges).
    effect(() => {
      const required = !this.editMode();
      const start = this.recordForm.get('start_time')!;
      const end = this.recordForm.get('end_time')!;
      start.setValidators(required ? [Validators.required] : []);
      end.setValidators(required ? [Validators.required] : []);
      start.updateValueAndValidity({ emitEvent: false });
      end.updateValueAndValidity({ emitEvent: false });
    });

    // Doble binding entre start_time y duration_minutes (end_time es fijo,
    // "ahora"): editar cualquiera de los dos recalcula el otro. `syncing`
    // evita el rebote infinito — al fijar uno mediante el otro, se hace con
    // emitEvent:false para no volver a disparar este mismo par de
    // suscripciones (time-range-fields sí sigue reaccionando normal,
    // su propia suscripción a start_time no pasa por este flag).
    let syncing = false;

    this.recordForm.get('start_time')!.valueChanges.subscribe(start => {
      if (syncing || !start) return;
      const end = this.recordForm.get('end_time')?.value;
      const minutes = durationMinutesBetween(start, end);
      syncing = true;
      this.recordForm.get('duration_minutes')!.setValue(minutes, { emitEvent: false });
      syncing = false;
    });

    this.recordForm.get('duration_minutes')!.valueChanges.subscribe(minutes => {
      if (syncing || minutes === null || minutes === '') return;
      const end = this.recordForm.get('end_time')?.value;
      const start = timeMinusMinutes(end, Number(minutes));
      if (!start) return;
      syncing = true;
      this.recordForm.get('start_time')!.setValue(start, { emitEvent: false });
      syncing = false;
    });

    // Reset propio de este componente (pestaña activa + campos de horario) —
    // el reset de las cantidades ya lo hace el effect() heredado de QuantityModal.
    effect(() => {
      if (!this.visible()) {
        this.activeTab.set('horario');
        this.recordForm.patchValue(
          { start_time: null, end_time: null, duration_minutes: null },
          { emitEvent: false },
        );
      }
    });
  }

  protected onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  // Cantidades queda deshabilitada (no solo bloqueada al hacer clic) hasta
  // completar Horario — evita que app-ui-tabs marque su botón como activo
  // mientras el contenido sigue mostrando Horario (el signal interno del
  // hijo se movería igual aunque este componente rechace el cambio).
  protected get tabsView(): TabItem[] {
    return this.tabs.map((tab) => ({
      ...tab,
      hasError: tab.key === 'horario' && this.horarioTabHasError,
      disabled: tab.key === 'quantities' && !this.horarioComplete,
    }));
  }

  private get horarioTabHasError(): boolean {
    if (this.editMode()) return false;
    const start = this.recordForm.get('start_time');
    const end = this.recordForm.get('end_time');
    return (start?.invalid && start?.touched) || (end?.invalid && end?.touched) || this.horarioInvalid;
  }

  protected get horarioComplete(): boolean {
    if (this.editMode()) return true;
    return !!this.recordForm.get('start_time')?.value && !!this.recordForm.get('end_time')?.value && !this.horarioInvalid;
  }

  protected get manualDurationMinutes(): number | null {
    return durationMinutesBetween(this.recordForm.get('start_time')?.value, this.recordForm.get('end_time')?.value);
  }

  // fin <= inicio (también la marca app-time-range-fields como horaFinMenor
  // en el propio control end_time, pero se sigue usando aquí para bloquear
  // Guardar/avanzar de pestaña sin depender de que ese control esté touched).
  protected get manualRangeInvalid(): boolean {
    const start = this.recordForm.get('start_time')?.value;
    const end = this.recordForm.get('end_time')?.value;
    return !!start && !!end && this.manualDurationMinutes === null;
  }

  private get normalizedShiftStart(): string | null {
    return this.shiftStartTime ? this.shiftStartTime.slice(0, 5) : null;
  }

  // La hora inicial no puede quedar antes de que arrancara el turno —
  // comparación lexicográfica sobre "HH:mm", válida por ser ancho fijo.
  protected get startBeforeShiftInvalid(): boolean {
    const start = this.recordForm.get('start_time')?.value;
    const shiftStart = this.normalizedShiftStart;
    return !!start && !!shiftStart && start < shiftStart;
  }

  protected get horarioInvalid(): boolean {
    return this.manualRangeInvalid || this.startBeforeShiftInvalid;
  }

  // La hora fin de un registro manual siempre es "ahora" — no se pide, solo
  // se muestra bloqueada (app-time-range-fields [disableEnd]). Se calcula al
  // abrir el modal (este componente se recrea cada vez por el @if(visible())
  // del padre), no en un effect, para no reevaluarla mientras el usuario
  // ajusta la hora de inicio.
  protected get currentTimeHHmm(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // Botón principal del footer: mientras se está en Horario, solo avanza a
  // Cantidades (habilitado apenas horario queda completo); una vez en
  // Cantidades vuelve a ser el guardar real, sujeto a la validez del form.
  protected get primaryActionLabel(): string {
    return this.activeTab() === 'horario' ? 'Siguiente' : 'Guardar';
  }

  protected get primaryActionDisabled(): boolean {
    if (this.isSubmitting() || !this.enable) return true;
    if (this.activeTab() === 'horario') return !this.horarioComplete;
    return this.recordForm.invalid || this.horarioInvalid;
  }

  protected onPrimaryAction(): void {
    if (this.activeTab() === 'horario') {
      this.activeTab.set('quantities');
      return;
    }
    this.save();
  }

  protected get editRecord() {
    return this.qms.editRecord();
  }

  protected toLocalDate(value: string | null | undefined): Date | null {
    return toLocalDateUtil(value);
  }

  protected override buildPayload(): Partial<ProductionRecord> | null {
    if (this.editMode()) return super.buildPayload();
    if (!this.horarioComplete) return null;

    const payload = super.buildPayload();
    if (!payload) return null;

    return { ...payload, duration_seconds: this.manualDurationMinutes! * 60 };
  }
}
