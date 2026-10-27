import { Type } from '@angular/core';
import { DocumentIntegrationMatrix } from '../options/production/document-integration-matrix/document-integration-matrix';

// Component of an area section plus the fixed inputs it is drawn with (besides `document`).
export interface OriginDetailEntry {
  component: Type<unknown>;
  inputs?: Record<string, unknown>;
}

// Area-specific section of a document, by origin_id, drawn after the common
// sections. The `detail` of the API response changes per area: to support a new
// one, create its component (input `document`, the WorkCenterDocument) and
// register it here. Origins without an entry show no extra section.
export const ORIGIN_DETAIL_COMPONENTS: Record<number, OriginDetailEntry> = {
  // Confección: color x size grid with the integration state of every SKU.
  1: { component: DocumentIntegrationMatrix },
};
