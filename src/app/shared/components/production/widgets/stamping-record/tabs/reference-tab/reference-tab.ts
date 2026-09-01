import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../../../../../../elements/ui-icon/ui-icon';
import { Searcher } from '../../../../../form-controls/searcher/searcher';
import { UiFormField } from '../../../../../../elements/ui-form-field/ui-form-field';
import { StampingReferenceCard } from '../../../../cards/stamping-reference-card/stamping-reference-card';
import { StampingReferenceSam } from '../../../../../../../models/stamping/stamping-reference-sam';

@Component({
  selector: 'app-reference-tab',
  standalone: true,
  imports: [UiIcon, Searcher, UiFormField, StampingReferenceCard],
  templateUrl: './reference-tab.html',
})
export class ReferenceTab {
  @Input() isLoading = false;
  @Input() references: StampingReferenceSam[] = [];
  @Input() selectedId: number | null = null;
  @Input() hasReferenceSams = false;
  @Output() search = new EventEmitter<string>();
  @Output() toggle = new EventEmitter<number>();
}
