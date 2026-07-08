import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingTechnique } from '../../models/stamping/stamping-technique';

@Injectable({
  providedIn: 'root',
})
export class StampingTechniqueService extends BaseCrudService<StampingTechnique> {
  protected override _endpoint: string = '/stamping/techniques/';
}
