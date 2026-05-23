import { Directive, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { getInputIconClasses } from '../functions/get-input-icon-classes';

@Directive()
export abstract class BaseInputIcon {

  @Input() invalid: boolean = false;
  @Input() extraInvalid: boolean = false;
  @Input() control: AbstractControl | null = null;
  @Input() large: boolean = false;
  @Input() positionClassNames: string = '';

  protected computeInvalid(): boolean {
    if (this.control) {
      return (this.control.invalid && this.control.touched) || this.extraInvalid;
    }
    return this.invalid || this.extraInvalid;
  }

  get isInvalid(): boolean {
    return this.computeInvalid();
  }

  get className(): string {
    const isInvalid = this.computeInvalid();
    const position = this.positionClassNames || (this.large ? 'right-4 top-1/2 -translate-y-1/2' : 'right-3 top-1/2 -translate-y-1/2');
    return `${position} ${getInputIconClasses(isInvalid)}`;
  }
}