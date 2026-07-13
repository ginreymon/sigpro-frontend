import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Searcher } from '../../form-controls/searcher/searcher';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { TableToolsButtons, TableToolsButtonType } from '../../../../common/interfaces/table-tools-buttons';

@Component({
  selector: 'app-table-tools',
  imports: [Searcher, UiButton, UiIcon],
  templateUrl: './table-tools.html',
  styleUrl: './table-tools.css',
})
export class TableTools {
  @Output() onSearch = new EventEmitter<string>();
  @Output() onClick = new EventEmitter<TableToolsButtonType>();
  @Input() live: boolean = false;
  @Input() tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  searchHandler(value: string) {
    this.onSearch.emit(value);
  }

  actionHandler(type: TableToolsButtonType) {
    this.onClick.emit(type);
  }
}
