import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { SiesaOutboundDocument } from '../../models/integration/siesa-outbound-document';

@Injectable({
  providedIn: 'root',
})
export class SiesaOutboundDocumentService extends BaseCrudService<SiesaOutboundDocument> {
  protected override _endpoint: string = '/integration/siesa-outbound-documents/';
}
