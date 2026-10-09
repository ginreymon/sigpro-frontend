import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { UiCombobox } from '../../../../shared/elements/ui-combobox/ui-combobox';
import { UiCheckbox } from '../../../../shared/elements/ui-checkbox/ui-checkbox';
import { Reference } from '../../../../models/stamping/reference';

@Component({
  selector: 'app-identification-tab',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiCombobox, UiCheckbox],
  templateUrl: './identification-tab.html',
})
export class IdentificationTab {
  @Input({ required: true }) form!: FormGroup;
  @Input() references: Reference[] = [];
  @Output() referenceSelect = new EventEmitter<{ index: number; value: Reference }>();

  get noReference() { return this.form.get('no_reference'); }
  get rowidItem() { return this.form.get('rowid_item'); }
  get referenceCode() { return this.form.get('reference_code'); }
}
