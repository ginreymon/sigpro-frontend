// Labels and looks of the selector cells of the integrate modal, shared by every origin (the Confección
// matrix cells and the Estampación OP selector), so each origin option stays independent of the others.

// Matrix cell state, from the SKU quantities of the integration endpoint (recordedQuantity,
// integratedQuantity, tepProcessedAndComplete). "To integrate" = recorded - integrated:
//   integrated = tepProcessedAndComplete (ordered = integrated),
//   ready      = recorded = ordered with something left to integrate: integrating completes the SKU
//                (selectable),
//   partial    = 0 < recorded < ordered: integrating leaves the SKU incomplete (selectable when
//                there is something left to integrate; 'danger' intent),
//   complete   = nothing to integrate and produced (completed + rejected + scrap) = ordered ('cancel' intent),
//   open       = has open records                                    ('action' intent),
//   warning    = completed units but no records (quantities only from the ERP, nothing to
//                integrate; informative only, no hover; 'warning' intent),
//   none       = nothing produced (outline only: gray border, no fill).
export type SkuCellState = 'integrated' | 'ready' | 'complete' | 'open' | 'partial' | 'warning' | 'none';

export const CELL_STATE_LABELS: Record<SkuCellState, string> = {
  integrated: 'Integrado',
  ready: 'Por integrar',
  complete: 'Completo',
  open: 'Registros abiertos',
  partial: 'Parcial',
  warning: 'Error',
  none: 'Sin producción',
};

// Tailwind classes of each matrix cell (background, text and border). Intent colors come from ButtonBase.
export const CELL_STATE_CLASSES: Record<SkuCellState, string> = {
  integrated: 'bg-green-100 text-green-700 border-green-500',
  ready:
    'bg-brand-100 border-brand-300 cursor-pointer duration-200 font-semibold hover:bg-brand-200 hover:text-brand-900',
  complete: 'text-gray-600 border-transparent hover:bg-gray-100',
  open: 'text-gray-700 bg-gray-200 border-transparent hover:bg-gray-300',
  partial: 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200',
  warning: 'text-amber-700 bg-amber-100 border-amber-300',
  none: 'bg-transparent text-slate-500 border-slate-300',
};

// Replaces the `ready` look once the user picked the cell.
export const CELL_SELECTED_CLASSES = 'bg-brand-500 text-white border-brand-500';

// Same, for a picked partial cell: it keeps the red of its state.
export const CELL_SELECTED_PARTIAL_CLASSES = 'bg-red-500 text-white border-red-500';
