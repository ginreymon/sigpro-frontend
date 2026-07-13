import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiInput } from '../../../elements/ui-input/ui-input';
import { FormsModule } from '@angular/forms';
import { ButtonBaseType } from '../../../../common/classes/button-base';
import { UiIconStateDirective } from '../../../../directives/ui-icon-state-directive';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-searcher',
  imports: [UiButton, UiIcon, UiInput, FormsModule, UiIconStateDirective],
  templateUrl: './searcher.html',
  styleUrl: './searcher.css',
})
export class Searcher implements OnDestroy {
  @Input() intent: ButtonBaseType = 'accept';
  @Input() live: boolean = false;
  @Output() onSearch = new EventEmitter<string>();
  model: string = '';

  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.inputSubject.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(value => this.onSearch.emit(value));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInputChange(value: string) {
    this.model = value;
    if (this.live) this.inputSubject.next(value);
  }

  submit() {
    this.onSearch.emit(this.model);
  }

  clear() {
    this.model = '';
    this.onSearch.emit('');
  }
}
