import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../../shared/elements/ui-select/ui-select';
import { StampingLocation } from '../../../../models/stamping/stamping-location';
import { StampingMachineType } from '../../../../models/stamping/stamping-machine-type';
import { StampingPiece } from '../../../../models/stamping/stamping-piece';
import { StampingFabricType } from '../../../../models/stamping/stamping-fabric-type';

@Component({
  selector: 'app-production-tab',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiSelect],
  templateUrl: './production-tab.html',
})
export class ProductionTab {
  @Input({ required: true }) form!: FormGroup;
  @Input() locations: StampingLocation[] = [];
  @Input() machineTypes: StampingMachineType[] = [];
  @Input() pieces: StampingPiece[] = [];
  @Input() fabricTypes: StampingFabricType[] = [];

  get location() { return this.form.get('location'); }
  get machineType() { return this.form.get('machine_type'); }
  get piece() { return this.form.get('piece'); }
  get taskPeopleCount() { return this.form.get('task_people_count'); }
  get stampedPieces() { return this.form.get('stamped_pieces'); }
  get piecesPerBoard() { return this.form.get('pieces_per_board'); }
  get fabricType() { return this.form.get('fabric_type'); }
}
