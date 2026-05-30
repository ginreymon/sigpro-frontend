import { Component, signal } from '@angular/core';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { ModuleDetailBottomSheet, ModuleCard } from '../../../shared/components/module-detail-bottom-sheet/module-detail-bottom-sheet';

@Component({
  selector: 'app-module-panel',
  imports: [UiIcon, ModuleDetailBottomSheet],
  templateUrl: './module-panel.html',
})
export class ModulePanel {
  selectedModule = signal<ModuleCard | null>(null);
  sheetVisible = signal(false);

  readonly modules = signal<ModuleCard[]>([
    { number: 1,  name: 'Corte',                status: 'Activo',   efficiency: 88.5, trend:  1.2, history: [45, 60, 72, 88] },
    { number: 2,  name: 'Confección',            status: 'Activo',   efficiency: 92.3, trend:  0.8, history: [75, 80, 85, 92] },
    { number: 3,  name: 'Bordado',               status: 'Pausado',  efficiency: 74.1, trend: -2.3, history: [80, 78, 76, 74] },
    { number: 4,  name: 'Control de Calidad',    status: 'Activo',   efficiency: 91.8, trend:  0.5, history: [50, 66, 75, 100] },
    { number: 5,  name: 'Empaque',               status: 'Activo',   efficiency: 85.6, trend:  3.1, history: [60, 70, 78, 85] },
    { number: 6,  name: 'Serigrafía',            status: 'Inactivo', efficiency:  0.0, trend:  0.0, history: [0, 0, 0, 0] },
    { number: 7,  name: 'Terminado',             status: 'Activo',   efficiency: 79.4, trend: -1.1, history: [85, 82, 80, 79] },
    { number: 8,  name: 'Lavandería',            status: 'Activo',   efficiency: 95.2, trend:  2.4, history: [88, 90, 93, 95] },
    { number: 9,  name: 'Estampado',             status: 'Pausado',  efficiency: 61.0, trend: -4.5, history: [70, 67, 64, 61] },
    // { number: 10, name: 'Revisión Final',        status: 'Activo',   efficiency: 87.3, trend:  1.8, history: [80, 83, 85, 87] },
    // { number: 11, name: 'Deshebrado',            status: 'Activo',   efficiency: 83.7, trend:  0.3, history: [78, 80, 82, 83] },
    // { number: 12, name: 'Plancha',               status: 'Inactivo', efficiency:  0.0, trend:  0.0, history: [0, 0, 0, 0] },
    // { number: 13, name: 'Doblez y Etiquetado',   status: 'Activo',   efficiency: 90.1, trend:  1.5, history: [84, 86, 88, 90] },
    // { number: 14, name: 'Despacho',              status: 'Activo',   efficiency: 76.8, trend: -0.7, history: [79, 78, 77, 76] },
  ]);

  openSheet(mod: ModuleCard): void {
    this.selectedModule.set(mod);
    this.sheetVisible.set(true);
  }

  closeSheet(): void {
    this.sheetVisible.set(false);
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  badgeClass(status: string): string {
    const colors: Record<string, string> = {
      Activo:   'bg-green-100 text-green-700',
      Inactivo: 'bg-gray-100 text-gray-500',
      Pausado:  'bg-amber-100 text-amber-700',
    };
    return `text-xs font-semibold px-2 py-0.5 rounded ${colors[status] ?? 'bg-gray-100 text-gray-500'}`;
  }

  efficiencyClass(status: string): string {
    return `text-3xl font-bold ${status === 'Activo' ? 'text-brand-500' : 'text-gray-400'}`;
  }

  trendIconClass(trend: number): string {
    const color = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400';
    return `w-3 h-3 ${color}`;
  }

  trendTextClass(trend: number): string {
    const color = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400';
    return `text-xs font-medium ${color}`;
  }

  trendLabel(trend: number): string {
    if (trend === 0) return '0.0% hoy';
    return `${trend > 0 ? '+' : ''}${trend.toFixed(1)}% hoy`;
  }

  barClass(status: string, last: boolean): string {
    const active = status === 'Activo';
    return `w-2 rounded-t-sm ${last ? (active ? 'bg-brand-500' : 'bg-gray-400') : (active ? 'bg-brand-200' : 'bg-gray-200')}`;
  }
}
