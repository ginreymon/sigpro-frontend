import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingPiece } from '../../models/stamping/stamping-piece';

@Injectable({
  providedIn: 'root',
})
export class StampingPieceService extends BaseCrudService<StampingPiece> {
  protected override _endpoint: string = '/stamping/pieces/';
}
