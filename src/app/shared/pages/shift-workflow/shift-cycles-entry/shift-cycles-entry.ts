import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { RouteContextService } from '../../../../services/core/route-context-service';
import { LoaderService } from '../../../../services/common/loader-service';
import { ShiftCycles } from './shift-cycles/shift-cycles';
import { ShiftCyclesManual } from './shift-cycles-manual/shift-cycles-manual';

// Punto de entrada de la ruta shift-cycles: decide qué página montar según
// Module.allows_production_time_adjustment (apps/production/models/module.py) del
// módulo activo en la sesión de trabajo actual — app-shift-cycles-manual si
// está habilitado, app-shift-cycles si no. Solo se instancia uno de los dos,
// cada uno con su propio ciclo de carga de contexto (evita duplicar el
// forkJoin completo de ProductionContextService.load() que haría revisar el
// flag desde dentro de cada página).
@Component({
  selector: 'app-shift-cycles-entry',
  imports: [ShiftCycles, ShiftCyclesManual],
  templateUrl: './shift-cycles-entry.html',
})
export class ShiftCyclesEntry implements OnInit {
  private workSessionService = inject(WorkSessionService);
  private routeContextService = inject(RouteContextService);
  private loaderService = inject(LoaderService);

  protected checked = signal(false);
  protected manual = signal(false);

  ngOnInit(): void {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    this.loaderService.showLoader();
    this.workSessionService.getActive(scopeParams)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (session) => {
          this.manual.set(!!session?.current_module?.allows_production_time_adjustment);
          this.checked.set(true);
        },
        error: () => this.checked.set(true),
      });
  }
}
