import { Component, Input } from '@angular/core';

/** Groups related form fields inside a modal: title, optional hint and a responsive column grid. */
@Component({
  selector: 'app-ui-form-section',
  imports: [],
  templateUrl: './ui-form-section.html',
  styleUrl: './ui-form-section.css',
})
export class UiFormSection {
  @Input() title: string | null = null;
  @Input() description: string | null = null;
  /** Columns from the `sm` breakpoint up; always one column on phones. */
  @Input() cols: 1 | 2 | 3 = 1;

  protected get gridClass(): string {
    return this.cols === 3 ? 'sm:grid-cols-3' : this.cols === 2 ? 'sm:grid-cols-2' : '';
  }
}
