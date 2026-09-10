import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../../shared/elements/ui-select/ui-select';
import { StampingStampTypeDescription } from '../../../../models/stamping/stamping-stamp-type-description';
import { StampingTechnique } from '../../../../models/stamping/stamping-technique';
import { StampingLayoutForm } from '../../../../models/stamping/stamping-layout-form';

@Component({
  selector: 'app-process-tab',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiSelect],
  templateUrl: './process-tab.html',
})
export class ProcessTab {
  @Input({ required: true }) form!: FormGroup;
  @Input() stampTypeDescriptions: StampingStampTypeDescription[] = [];
  @Input() techniques: StampingTechnique[] = [];
  @Input() layoutForms: StampingLayoutForm[] = [];

  get stampTypeDescription() { return this.form.get('stamp_type_description'); }
  get technique() { return this.form.get('technique'); }
  get frames() { return this.form.get('frames'); }
  get inks() { return this.form.get('inks'); }
  get prints() { return this.form.get('prints'); }
  get layoutForm() { return this.form.get('layout_form'); }
  get preDried() { return this.form.get('pre_dried'); }
}
