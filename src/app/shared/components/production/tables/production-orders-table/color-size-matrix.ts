import { ProductionOrder } from '../../../../../models/production/production-order';
import { ColorDetail } from '../../../../../models/production/color-detail';
import { SizeQtyDetail } from '../../../../../models/production/size-detail';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export interface ColorSizeMatrix {
  sizes: string[];
  skuColors: ColorDetail[];
  totalBySizes: SizeQtyDetail[];
  grandTotal: SizeQtyDetail;
}

export function emptySize(size: string): SizeQtyDetail {
  return { size, skuRowId: 0, orderedQty: 0, plannedQty: 0, completedQty: 0, wasteQty: 0, rejectedQty: 0 };
}

function sortSizes(sizes: SizeQtyDetail[]): SizeQtyDetail[] {
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

export function sumInto(total: SizeQtyDetail, s: SizeQtyDetail): void {
  total.completedQty += s.completedQty;
  total.orderedQty += s.orderedQty;
  total.plannedQty += s.plannedQty;
  total.wasteQty += s.wasteQty;
  total.rejectedQty += s.rejectedQty;
}

// Builds the color x size pivot shared by ProductionOrdersTable (grid view)
// and OrderSkuAuditTable (flat row view) from the same ProductionOrder payload.
export function buildColorSizeMatrix(order: ProductionOrder): ColorSizeMatrix {
  const sizeSet = new Set<string>();

  let skuColors = [...order.colors]
    .sort((a, b) => a.color.localeCompare(b.color))
    .map((c) => {
      const sizes = sortSizes(c.sizes);
      sizes.forEach((s) => sizeSet.add(s.size));
      return { ...c, sizes };
    });

  const numberSizes = Array.from(sizeSet)
    .filter((s) => !isNaN(Number(s)))
    .sort((a, b) => Number(a) - Number(b));

  const letterSizes = Array.from(sizeSet)
    .filter((s) => isNaN(Number(s)))
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const sizes = [...numberSizes, ...letterSizes];

  skuColors = skuColors.map((c) => {
    const sizeMap = new Map(c.sizes.map((s) => [s.size, s]));
    return { ...c, sizes: sizes.map((size) => sizeMap.get(size) ?? emptySize(size)) };
  });

  const totalsMap = new Map<string, SizeQtyDetail>(sizes.map((s) => [s, emptySize(s)]));
  skuColors.forEach((c) => c.sizes.forEach((s) => {
    const total = totalsMap.get(s.size);
    if (total) sumInto(total, s);
  }));

  const totalBySizes = Array.from(totalsMap.values());
  const grandTotal = emptySize('');
  totalBySizes.forEach((ts) => sumInto(grandTotal, ts));

  return { sizes, skuColors, totalBySizes, grandTotal };
}
