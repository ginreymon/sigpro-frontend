import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiErrorMessage } from '../../../../../elements/ui-error-message/ui-error-message';
import { UiInput } from '../../../../../elements/ui-input/ui-input';

// Integer units only (the number input also lets "e", signs and decimals through).
const WHOLE_NUMBER = /^\d+$/;

// "Cantidad a integrar (und)" input shared by the Confección and Estampación integration views.
// It validates the typed text (whole number >= 1) and emits the quantity, or null while it is empty or
// invalid. Typing more than `max` ("Por integrar") is allowed: it is not an error and does not stop anything.
@Component({
  selector: 'app-integration-quantity-input',
  imports: [DecimalPipe, ReactiveFormsModule, UiErrorMessage, UiInput],
  templateUrl: './integration-quantity-input.html',
})
export class IntegrationQuantityInput implements OnInit {
  private static nextId = 0;
  // Unique per instance: several OPs can be expanded at once.
  protected readonly uid = IntegrationQuantityInput.nextId++;

  // Units still to integrate, shown as "Por integrar".
  readonly max = input.required<number>();
  // Quantity to show when the input appears (restored after collapsing the accordion or switching mode).
  readonly initial = input(0);
  // Valid quantity typed, or null while the input is empty or invalid.
  readonly quantityChange = output<number | null>();

  protected readonly control = new FormControl<string | null>('');
  // Why the typed text cannot be integrated (null while it is valid or still empty).
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((value) => this.validate(value));
  }

  ngOnInit(): void {
    if (this.initial() > 0) this.control.setValue(String(this.initial()), { emitEvent: false });
  }

  private validate(raw: string | null): void {
    const text = String(raw ?? '').trim();
    const quantity = Number(text);
    let error: string | null = null;

    if (text && !WHOLE_NUMBER.test(text)) error = 'Ingrese un número entero.';
    else if (text && quantity < 1) error = 'La cantidad debe ser mayor a 0.';

    this.error.set(error);
    this.quantityChange.emit(text && !error ? quantity : null);
  }
}
