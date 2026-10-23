import { Type } from '@angular/core';
import { DocumentColorsDetail } from './document-colors-detail/document-colors-detail';
import { DocumentColorsTable } from './document-colors-table/document-colors-table';

// `view`: side modal (eye). `integrate`: central modal (Integrar).
export type DocumentDetailMode = 'view' | 'integrate';

// Component of an area section plus the fixed inputs it is drawn with (besides `document`).
export interface OriginDetailEntry {
  component: Type<unknown>;
  inputs?: Record<string, unknown>;
}

// Area-specific section of a document, by mode and origin_id. The `detail` of the
// API response changes per area: to support a new one, create its component (input
// `document`, the WorkCenterDocument) and register it here. In `view`, the section
// goes after the common ones; in `integrate`, it replaces them. Origins without an
// entry show no extra section (view) or the common sections (integrate).
export const ORIGIN_DETAIL_COMPONENTS: Record<DocumentDetailMode, Record<number, OriginDetailEntry>> = {
  view: {
    1: { component: DocumentColorsDetail }, // Confección: completed / ordered per color
  },
  integrate: {
    // Confección: one row per color with its totals; expands to the SKU breakdown.
    1: { component: DocumentColorsTable },
  },
};
