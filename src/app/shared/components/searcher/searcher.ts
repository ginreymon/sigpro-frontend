import { Component, EventEmitter, Output } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiInput } from '../../elements/ui-input/ui-input';
import { FormsModule } from '@angular/forms';
import { getUiIconClasses } from '../../../common/functions/get-input-icon-classes';

@Component({
  selector: 'app-searcher',
  imports: [UiButton, UiIcon, UiInput, FormsModule],
  templateUrl: './searcher.html',
  styleUrl: './searcher.css',
})
export class Searcher {
  @Output() onSearch = new EventEmitter<string>();
  model: string = '';

  submit() {
    this.onSearch.emit(this.model);
  }

  clear() {
    this.model = '';
    this.submit();
  }

  get classes() {
    return getUiIconClasses(false);
  }
}
