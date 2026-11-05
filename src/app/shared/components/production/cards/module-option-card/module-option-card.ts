import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { EllipsisPipe } from '../../../../../pipes/ellipsis-pipe';
import { Module } from '../../../../../models/production/module';

@Component({
  selector: 'app-module-option-card',
  imports: [UiOptionCard, UiIcon, TitleCasePipe, EllipsisPipe],
  templateUrl: './module-option-card.html',
})
export class ModuleOptionCard {
  @HostBinding('class') readonly hostClass = 'min-w-50 max-w-50';

  @Input() mod: Module | null = null;
  @Input() all = false;
  @Input() label = 'Módulo';
  @Input() selected = false;
  @Output() onToggle = new EventEmitter<void>();
}
