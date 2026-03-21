import { Directive, HostBinding, Input } from '@angular/core';
import { getUiIconClasses } from '../common/functions/get-input-icon-classes';

@Directive({
  selector: '[appUiIconState]',
})
export class UiIconStateDirective {
  @Input('appUiIconState') invalid: boolean = false;

  @HostBinding('class')
  get classes(): string {
    return getUiIconClasses(this.invalid);
  }
}
