import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appTableTemplate]',
})
export class TableTemplate {
  @Input('appTableTemplate') name!: string;
  constructor(public template: TemplateRef<any>) {}
}
