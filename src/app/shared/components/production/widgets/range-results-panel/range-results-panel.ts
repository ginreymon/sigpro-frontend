import { Component, EventEmitter, Input, Output, computed, inject, input, model } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';
import { ModuleEfficiencySummary } from '../../../../../common/interfaces/module-efficiency-summary';
import { DateRangeForm, DateRangeValue } from '../../../form-controls/date-range-form/date-range-form';
import { UiSelect } from '../../../../elements/ui-select/ui-select';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

export interface RangeUnitOption {
  id: number;
  name: string;
}

// Period query shared by ModulePanel and MachinePanel: filter bar (unit + date range +
// Consultar) and the summary table. Unit filtering is client-side over the queried rows,
// so changing it never triggers a request.
@Component({
  selector: 'app-range-results-panel',
  standalone: true,
  imports: [DecimalPipe, FormsModule, DateRangeForm, UiSelect, UiButton, UiIcon],
  templateUrl: './range-results-panel.html',
})
export class RangeResultsPanel {
  private appConfig = inject(AppConfigService);

  readonly summaries = input.required<ModuleEfficiencySummary[]>();
  readonly unitOptions = input<RangeUnitOption[]>([]);
  // "Módulo" / "Máquina": column header, filter label and copy.
  readonly unitLabel = input('Módulo');

  @Input() defaultRange: DateRangeValue | null = null;
  @Input() loading = false;
  @Input() searched = false;
  @Input() error = false;
  @Output() search = new EventEmitter<DateRangeValue>();
  @Output() retry = new EventEmitter<void>();

  // 0 = all units (plant summary included).
  readonly selectedUnitId = model(0);

  readonly unitItems = computed(() => [{ id: 0, name: 'Todos' }, ...this.unitOptions()]);

  readonly visibleSummaries = computed(() => {
    const id = this.selectedUnitId();
    return id === 0 ? this.summaries() : this.summaries().filter(s => s.moduleId === id);
  });

  efficiencyColor(value: number): string {
    return efficiencyTextColor(value, this.appConfig.highEfficiencyLimit, this.appConfig.lowEfficiencyLimit);
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  clearUnitFilter(): void {
    this.selectedUnitId.set(0);
  }
}
