import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiMultiStepForm, MultiStepConfig } from '../ui-multi-step-form';
import { UiStep, UiSummary } from '../ui-step.directive';
import { UiOptionCard } from '../../ui-option-card/ui-option-card';
import { UiInput } from '../../ui-input/ui-input';
import { UiButton } from '../../ui-button/ui-button';
import { UiBadge } from '../../ui-badge/ui-badge';

interface DemoOption {
  id: number;
  name: string;
  detail: string;
}

/**
 * Integration example (not routed): selection -> configuration -> summary/confirm.
 * All state lives here; the form shell only handles navigation and gating.
 */
@Component({
  selector: 'app-ui-multi-step-form-demo',
  imports: [FormsModule, UiMultiStepForm, UiStep, UiSummary, UiOptionCard, UiInput, UiButton, UiBadge],
  templateUrl: './ui-multi-step-form-demo.html',
})
export class UiMultiStepFormDemo {
  readonly options: DemoOption[] = [
    { id: 1, name: 'Línea de corte', detail: 'Corte y preparación de piezas' },
    { id: 2, name: 'Línea de estampación', detail: 'Estampado de prendas' },
    { id: 3, name: 'Línea de confección', detail: 'Ensamble de prendas' },
  ];

  readonly multiple = signal(true);
  readonly selectedIds = signal<number[]>([]);
  readonly name = signal('');
  readonly quantity = signal('');

  readonly submitting = signal(false);
  readonly done = signal(false);

  readonly selected = computed(() => this.options.filter((o) => this.selectedIds().includes(o.id)));
  readonly quantityValid = computed(() => Number(this.quantity()) > 0);

  readonly steps = computed<MultiStepConfig[]>(() => [
    { key: 'selection', label: 'Selección', description: 'Elija las líneas', valid: this.selectedIds().length > 0 },
    {
      key: 'config',
      label: 'Configuración',
      description: 'Datos del lote',
      valid: this.name().trim().length > 0 && this.quantityValid(),
    },
  ]);

  isSelected(id: number) {
    return this.selectedIds().includes(id);
  }

  toggle(option: DemoOption) {
    if (!this.multiple()) return this.selectedIds.set([option.id]);
    this.selectedIds.update((ids) => (ids.includes(option.id) ? ids.filter((i) => i !== option.id) : [...ids, option.id]));
  }

  setMode(multiple: boolean) {
    this.multiple.set(multiple);
    if (!multiple) this.selectedIds.update((ids) => ids.slice(0, 1));
  }

  submit() {
    if (this.submitting()) return;
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.done.set(true);
    }, 1200);
  }

  reset() {
    this.selectedIds.set([]);
    this.name.set('');
    this.quantity.set('');
    this.done.set(false);
  }
}
