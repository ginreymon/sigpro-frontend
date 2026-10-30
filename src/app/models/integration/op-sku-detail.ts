import { ColorRowDetail } from '../production/color-row-detail';

// Response of integration/orders-to-be-outbound/op-sku-detail/: the color x size detail of one Confección OP,
// including the SKUs already integrated (sp_detalle_integracion_op_produccion).
export interface OpSkuDetail {
  colorRows: ColorRowDetail[];
}
