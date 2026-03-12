import { Component, Input, Optional } from '@angular/core';
import { ControlContainer, FormControl } from '@angular/forms';
import { UiErrorMessage } from '../ui-error-message/ui-error-message';
import { FormFieldConfig } from '../../../common/interfaces/form-field-config';

@Component({
  selector: 'app-ui-form-field',
  imports: [UiErrorMessage],
  templateUrl: './ui-form-field.html',
  styleUrl: './ui-form-field.css',
})
export class UiFormField {
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  @Input() controls: Partial<FormFieldConfig>[] = [];
  @Input() groupLabel: string | null = null;

  @Input() set label(value: string) {
    this.updateFirstControl({ label: value });
  }

  @Input() set controlName(value: string) {
    this.updateFirstControl({ controlName: value });
  }

  constructor(@Optional() private controlContainer: ControlContainer) {}

  get label() {
    const field = this.controls.find((c) => {
      return c.controlName == this.controlName;
    });
    return field?.label!;
  }

  get controlName() {
    if (this.controls.length > 0) {
      const invalidControls = this.controls.filter((c) => {
        const control = this.controlContainer?.control?.get(c.controlName!);
        return control?.touched && control?.invalid;
      });

      if (invalidControls.length > 0) return invalidControls[0].controlName!;
    }
    return this.controls[0].controlName!;
  }

  get control(): FormControl | null {
    return this.controlContainer?.control?.get(this.controlName) as FormControl;
  }

  private updateFirstControl(value: Partial<FormFieldConfig>) {
    if (this.controls.length === 0) {
      this.controls.push(value);
      return;
    }

    this.controls[0] = {
      ...this.controls[0],
      ...value,
    };
  }
}
