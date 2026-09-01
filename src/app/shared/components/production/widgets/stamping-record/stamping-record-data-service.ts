import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';
import { StampingOrderDetail } from '../../../../../models/stamping/stamping-order-detail';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';
import { filterByMachine, filterByMachineType } from '../../../../../common/functions/additional-time-filters';

// Component-scoped (see StampingRecord's `providers`): one instance per modal
// instance. Owns only the one-directional loading I/O (order/referenceSams/
// additionalTimes) — the interdependent form/validation state (reference
// selection gates quantity, quantity gates additional times) stays in
// StampingRecord itself, since splitting that further would just move the
// same coupling into cross-service calls.
@Injectable()
export class StampingRecordDataService {
  private additionalTimeService = inject(AdditionalStampingTimeService);
  private productionContextService = inject(ProductionContextService);
  private loaderService = inject(LoaderService);

  isLoadingModalData = signal(false);
  orderDetail = signal<StampingOrderDetail | null>(null);
  referenceSams = signal<StampingReferenceSam[]>([]);
  additionalTimes = signal<AdditionalStampingTime[]>([]);

  loadModalData(): void {
    this.isLoadingModalData.set(true);
    this.loaderService.showLoader();

    // El contexto de producción ya trae la OP resuelta vía
    // stamping-orders/detail (ver ShiftCycles.orderLoader), con
    // referenceSams incluido — no hay que volver a pedirla acá.
    const order = this.productionContextService.snapshot?.order as StampingOrderDetail | null;
    const moduleMachineTypeId = this.moduleMachineTypeId();
    const moduleMachineId = this.moduleMachineId();

    this.orderDetail.set(order);
    this.referenceSams.set(filterByMachineType(order?.referenceSams ?? [], moduleMachineTypeId));

    this.additionalTimeService.all()
      .pipe(finalize(() => {
        this.isLoadingModalData.set(false);
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: (additionalTimes) => {
          this.additionalTimes.set(filterByMachine(filterByMachineType(additionalTimes, moduleMachineTypeId), moduleMachineId));
        },
      });
  }

  private moduleMachineTypeId(): number | null {
    return this.productionContextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;
  }

  private moduleMachineId(): number | null {
    return this.productionContextService.snapshot?.session?.current_module?.machine?.id ?? null;
  }
}
