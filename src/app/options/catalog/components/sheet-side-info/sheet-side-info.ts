import { Component, Input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { TechnicalSheet } from '../../../../models/catalog/technical-sheet';
import { CharSquare } from '../../../../shared/components/char-square/char-square';
import { UiTooltip } from '../../../../shared/elements/ui-tooltip/ui-tooltip';
import { Metadata } from '../../../../shared/components/metadata/metadata';

@Component({
  selector: 'app-sheet-side-info',
  imports: [TitleCasePipe, CharSquare, UiTooltip, Metadata],
  templateUrl: './sheet-side-info.html',
})
export class SheetSideInfo {
  @Input() sheet: TechnicalSheet | null = null;
}
