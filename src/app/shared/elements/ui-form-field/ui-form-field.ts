import { Component, Input, Optional } from '@angular/core';
import { ControlContainer, FormControl } from '@angular/forms';
import { UiErrorMessage } from "../ui-error-message/ui-error-message";

@Component({
  selector: 'app-ui-form-field',
  imports: [UiErrorMessage],
  templateUrl: './ui-form-field.html',
  styleUrl: './ui-form-field.css',
})
export class UiFormField {
  @Input() label!: string;
  @Input() controlName!: string;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';

  constructor(@Optional() private controlContainer: ControlContainer) {}

  get control(): FormControl | null {
    return this.controlContainer?.control?.get(this.controlName) as FormControl;
  }
}
