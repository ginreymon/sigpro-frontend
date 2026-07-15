import { Injectable, inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { RouteContextService } from './route-context-service';

@Injectable({
  providedIn: 'root',
})
export class ShiftNavigationService {
  private router = inject(Router);
  private routeContextService = inject(RouteContextService);

  private get moduleUrl(): string {
    return this.routeContextService.currentModule?.url ?? 'production';
  }

  goToDayOperation(): void {
    this.router.navigateByUrl(`${this.moduleUrl}/day-operation`);
  }

  goToShiftCycles(queryParams?: Params): void {
    if (queryParams) {
      this.router.navigate(['/', this.moduleUrl, 'shift-cycles'], { queryParams });
    } else {
      this.router.navigateByUrl(`${this.moduleUrl}/shift-cycles`);
    }
  }
}
