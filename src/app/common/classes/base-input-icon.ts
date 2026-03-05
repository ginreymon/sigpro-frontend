import { Directive, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { getInputIconClasses } from '../functions/get-input-icon-classes';

@Directive()
export abstract class BaseInputIcon {

  @Input() invalid: boolean = false;
  @Input() control: AbstractControl | null = null;
  @Input() positionClassNames: string = 'right-3 top-9';

  protected computeInvalid(): boolean {
    if (this.control) {
      return this.control.invalid && this.control.touched;
    }
    return this.invalid;
  }

  get className(): string {
    const isInvalid = this.computeInvalid();
    return `${this.positionClassNames} ${getInputIconClasses(isInvalid)}`;
  }
}