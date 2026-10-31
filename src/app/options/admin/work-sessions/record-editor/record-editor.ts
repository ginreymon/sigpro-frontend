import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { DialogService } from '../../../../services/common/dialog-service';
import { LoaderService } from '../../../../services/common/loader-service';
import { apiErrorDetail } from '../../../../common/functions/api-error';
import { localInputToUtcIso, utcIsoToLocalInput } from '../../../../common/functions/date-utils';

export interface EditorField {
  key: string;
  label: string;
  type: 'number' | 'datetime';
}

let nextEditorId = 0;

// Inline editor of a few fields of one nested record: shows its current values, sends only
// the edited fields through `save` and, on success, updates the record so the screen stays in sync.
@Component({
  selector: 'app-record-editor',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiButton],
  templateUrl: './record-editor.html',
})
export class RecordEditor implements OnInit {
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private loader = inject(LoaderService);

  @Input({ required: true }) fields: EditorField[] = [];
  @Input({ required: true }) record!: Record<string, any>;
  @Input({ required: true }) save!: (payload: Record<string, any>) => Observable<unknown>;
  // When set, the fields are read-only and this text explains why.
  @Input() lockedReason: string | null = null;

  protected form!: FormGroup;
  protected readonly uid = `record-editor-${nextEditorId++}`;

  ngOnInit(): void {
    this.form = this.fb.group(
      Object.fromEntries(this.fields.map((f) => [f.key, [this.toControlValue(f)]])),
    );
    if (this.lockedReason) this.form.disable();
  }

  protected submit(): void {
    const payload: Record<string, any> = {};
    for (const f of this.fields) {
      const control = this.form.get(f.key)!;
      if (!control.dirty) continue;
      const value = control.value;
      if (f.type === 'datetime') payload[f.key] = value ? localInputToUtcIso(value) : null;
      else payload[f.key] = value === '' || value === null ? null : Number(value);
    }

    this.loader.showLoader();
    this.save(payload).subscribe({
      next: () => {
        Object.assign(this.record, payload);
        this.form.markAsPristine();
        this.loader.hideLoader();
        this.dialogService.openToast('Cambios guardados', 'El registro se actualizó correctamente.');
      },
      error: (err) => {
        this.loader.hideLoader();
        this.dialogService.openToast('No se pudo guardar', apiErrorDetail(err, 'Revisa los datos e intenta de nuevo.'));
      },
    });
  }

  private toControlValue(f: EditorField): string | number | null {
    const value = this.record[f.key];
    return f.type === 'datetime' ? utcIsoToLocalInput(value) : (value ?? null);
  }
}
