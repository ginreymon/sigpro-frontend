import { Component, Input } from '@angular/core';
import { AuditEntity } from '../../../common/interfaces/audit-entity';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-metadata',
  imports: [DatePipe],
  templateUrl: './metadata.html',
  styleUrl: './metadata.css',
})
export class Metadata {
  @Input() rowObject: Partial<AuditEntity> | undefined = undefined;
  @Input() showIsActive: boolean = false;
}
