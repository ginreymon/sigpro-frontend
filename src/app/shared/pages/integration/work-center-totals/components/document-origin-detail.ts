import { Type } from '@angular/core';
import { DocumentColorsDetail } from './document-colors-detail/document-colors-detail';
import { DocumentProductionTable } from './document-production-table/document-production-table';

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
    // Confección: production order color x size table, cells colored by status
    1: { component: DocumentProductionTable, inputs: { cellStyle: 'status' } },
  },
};
