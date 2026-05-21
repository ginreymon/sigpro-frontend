import { Component,  } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';


const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-module-efficiency',
  imports: [WorkSpaceLayout, NgClass, DatePipe, DecimalPipe],
  templateUrl: './module-efficiency.html',
  styleUrl: './module-efficiency.css',
})
export class ModuleEfficiencyPage {
  
}
