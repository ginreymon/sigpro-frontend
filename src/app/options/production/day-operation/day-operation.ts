import { Component } from '@angular/core';
import { WorkSpaceLayout } from "../../../layouts/work-space-layout/work-space-layout";
import { ProductionOrdersTable } from "../../../shared/elements/production-orders-table/production-orders-table";

@Component({
  selector: 'app-day-operation',
  imports: [WorkSpaceLayout, ProductionOrdersTable],
  templateUrl: './day-operation.html',
  styleUrl: './day-operation.css',
})
export class DayOperation {

}
