import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiInput } from '../../elements/ui-input/ui-input';
import { FormsModule } from '@angular/forms';
import { ButtonBaseType } from '../../../common/classes/button-base';
import { UiIconStateDirective } from '../../../directives/ui-icon-state-directive';

@Component({
  selector: 'app-searcher',
  imports: [UiButton, UiIcon, UiInput, FormsModule, UiIconStateDirective],
  templateUrl: './searcher.html',
  styleUrl: './searcher.css',
})
export class Searcher {
  @Input() intent: ButtonBaseType = 'accept';
  @Output() onSearch = new EventEmitter<string>();
  model: string = '';

  submit() {
    this.onSearch.emit(this.model);
  }

  clear() {
    this.model = '';
    this.submit();
  }
  
}
