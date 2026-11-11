import { ProductionOrder } from '../../../../../models/production/production-order';
import { ColorRowDetail } from '../../../../../models/production/color-row-detail';
import { SkuDetail } from '../../../../../models/production/sku-detail';
import { Totals } from '../../../../../models/production/totals';
import { ProductionRecord } from '../../../../../models/production/production-record';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export interface ColorSizeMatrix {
  sizes: string[];
  skuColors: ColorRowDetail[];
  totalBySizes: SkuDetail[];
  grandTotal: SkuDetail;
}

export function emptySize(size: string): SkuDetail {
  return { size, skuRowId: 0, orderedQty: 0, plannedQty: 0, completedQty: 0, wasteQty: 0, rejectedQty: 0 };
}

function sortSizes(sizes: SkuDetail[]): SkuDetail[] {
  const numberSizes = sizes
    .filter((s) => !isNaN(Number(s.size)))
    .sort((a, b) => Number(a.size) - Number(b.size));

  const letterSizes = sizes
    .filter((s) => isNaN(Number(s.size)))
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a.size);
      const bi = SIZE_ORDER.indexOf(b.size);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  return [...numberSizes, ...letterSizes];
}

export function sumInto(total: Totals, s: Totals): void {
  total.completedQty += s.completedQty;
  total.orderedQty += s.orderedQty;
  total.plannedQty += s.plannedQty;
  total.wasteQty += s.wasteQty;
  total.rejectedQty += s.rejectedQty;
}

// Aplica encima de una ProductionOrder los registros manuales aún no
// persistidos (shift-cycles-manual: ver ManualProductionRecordsStore — ahí
// se guardan en vez de llamar a POST production-records/). Clona colorRows/
// skus y suma las cantidades capturadas al sku que corresponda por
// skuRowId, para que buildColorSizeMatrix las refleje en el navegador sin
// volver a pedir la orden al backend.
export function applyPendingRecords(order: ProductionOrder, pending: Partial<ProductionRecord>[]): ProductionOrder {
  if (!pending.length) return order;

  return {
    ...order,
    colorRows: order.colorRows.map((c) => ({
      ...c,
      skus: c.skus.map((s) => {
        const extra = pending.filter((r) => r.sku_rowid === s.skuRowId);
        if (!extra.length) return s;
        return extra.reduce((acc, r) => ({
          ...acc,
          completedQty: acc.completedQty + Number(r.completed_quantity ?? 0),
          rejectedQty: acc.rejectedQty + Number(r.rejected_quantity ?? 0),
          wasteQty: acc.wasteQty + Number(r.scrap_quantity ?? 0),
        }), s);
      }),
    })),
  };
}

// Builds the color x size pivot shared by ProductionOrdersTable (grid view)
// and OrderSkuAuditTable (flat row view) from the same ProductionOrder payload.
export function buildColorSizeMatrix(order: ProductionOrder): ColorSizeMatrix {
  const sizeSet = new Set<string>();

  let skuColors = [...order.colorRows]
    .sort((a, b) => a.color.localeCompare(b.color))
    .map((c) => {
      const sizes = sortSizes(c.skus);
      sizes.forEach((s) => sizeSet.add(s.size));
      return { ...c, skus: sizes };
    });

  const numberSizes = Array.from(sizeSet)
    .filter((s) => !isNaN(Number(s)))
    .sort((a, b) => Number(a) - Number(b));

  const letterSizes = Array.from(sizeSet)
    .filter((s) => isNaN(Number(s)))
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const sizes = [...numberSizes, ...letterSizes];

  skuColors = skuColors.map((c) => {
    const sizeMap = new Map(c.skus.map((s) => [s.size, s]));
    return { ...c, skus: sizes.map((size) => sizeMap.get(size) ?? emptySize(size)) };
  });

  const totalsMap = new Map<string, SkuDetail>(sizes.map((s) => [s, emptySize(s)]));
  skuColors.forEach((c) => c.skus.forEach((s) => {
    const total = totalsMap.get(s.size);
    if (total) sumInto(total, s);
  }));

  const totalBySizes = Array.from(totalsMap.values());
  const grandTotal = emptySize('');
  totalBySizes.forEach((ts) => sumInto(grandTotal, ts));

  return { sizes, skuColors, totalBySizes, grandTotal };
}
