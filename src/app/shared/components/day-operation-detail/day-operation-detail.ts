import { Component, Input } from '@angular/core';
import { WorkSession } from '../../../models/production/work-session';
import { Metadata } from "../metadata/metadata";
import { TitleCasePipe } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-day-operation-detail',
  imports: [Metadata, TitleCasePipe, DatePipe],
  templateUrl: './day-operation-detail.html',
  styleUrl: './day-operation-detail.css',
})
export class DayOperationDetail {
  @Input() workSession: WorkSession | undefined | null;
}
