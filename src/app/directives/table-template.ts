import { Directive, Input, TemplateRef } from '@angular/core';

export interface TableTemplateContext<T> {
  $implicit: T;
}

@Directive({
  selector: '[appTableTemplate]',
})
export class TableTemplate<T> {
  @Input('appTableTemplate') name!: string;
  constructor(public template: TemplateRef<TableTemplateContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _dir: TableTemplate<T>,
    ctx: unknown,
  ): ctx is TableTemplateContext<T> {
    return true;
  }
}
