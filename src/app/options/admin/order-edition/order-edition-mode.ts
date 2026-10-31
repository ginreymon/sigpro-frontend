// Views available inside the order edition page.
export type OrderEditionMode = 'edit-records' | 'view-order';

export interface OrderEditionModeOption {
  key: OrderEditionMode;
  label: string;
}

// Adding a view means adding its key here, its option below and a @case in order-edition.html.
export const ORDER_EDITION_MODES: OrderEditionModeOption[] = [
  { key: 'edit-records', label: 'Editar registros' },
  { key: 'view-order', label: 'Ver OP' },
];
