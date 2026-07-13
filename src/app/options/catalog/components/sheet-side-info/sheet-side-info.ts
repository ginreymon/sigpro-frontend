import { Component, Input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { TechnicalSheet } from '../../../../models/catalog/technical-sheet';
import { CharSquare } from '../../../../shared/components/widgets/char-square/char-square';
import { UiTooltip } from '../../../../shared/elements/ui-tooltip/ui-tooltip';
import { Metadata } from '../../../../shared/components/widgets/metadata/metadata';
import { MeasureTable } from "../measure-table/measure-table";
import { SheetMeasurement } from '../../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../../models/catalog/sheet-elastic-cut';

@Component({
  selector: 'app-sheet-side-info',
  imports: [TitleCasePipe, CharSquare, UiTooltip, Metadata, MeasureTable],
  templateUrl: './sheet-side-info.html',
})
export class SheetSideInfo {
  @Input() sheet: TechnicalSheet | null = null;
  @Input() measurements: SheetMeasurement[] | null = null;
  @Input() elasticCuts: SheetElasticCut[] | null = null;
}
