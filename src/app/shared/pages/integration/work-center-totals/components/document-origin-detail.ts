import { Type } from '@angular/core';
import { DocumentColorsDetail } from './document-colors-detail';

// Area-specific section of a document, by origin_id. The `detail` of the API
// response changes per area: to support a new one, create its component (input
// `detail`) and register it here. Origins without an entry show no extra section.
export const ORIGIN_DETAIL_COMPONENTS: Record<number, Type<unknown>> = {
  1: DocumentColorsDetail, // Confección: colorRows
};
