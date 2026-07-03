import { TechnicalSheet } from './technical-sheet';
import { SkuReferenceInfo } from './sku-reference-info';
import { SheetMeasurement } from './sheet-measurement';
import { SheetElasticCut } from './sheet-elastic-cut';
import { TechnicalSheetImage } from './technical-sheet-image';
import { TechnicalSheetPieceImage } from './technical-sheet-piece-image';

export interface TechnicalSheetData extends Omit<TechnicalSheet, 'reference' | 'status'> {
  reference: SkuReferenceInfo | null;
  status: string | null;
  sizes: string[] | null;
  measurements: SheetMeasurement[] | null;
  elasticCutMeasures: SheetElasticCut[] | null;
  images: TechnicalSheetImage[] | null;
  pieceImages: TechnicalSheetPieceImage[] | null;
}
