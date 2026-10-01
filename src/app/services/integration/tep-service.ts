import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TepSendRequest, TepSendResponse } from '../../models/integration/tep-send';

@Injectable({
  providedIn: 'root',
})
export class TepService {
  constructor(private http: HttpClient) {}

  send(request: TepSendRequest): Observable<TepSendResponse> {
    return this.http.post<TepSendResponse>(
      `${environment.BASE_API_URL}/integration/tep/send/`,
      request,
    );
  }
}
