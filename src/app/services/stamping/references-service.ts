import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reference } from '../../models/stamping/reference';

@Injectable({ providedIn: 'root' })
export class ReferencesService {
  // Read lazily: BASE_API_URL is resolved by an app initializer after this service may be created.
  private get endpoint(): string {
    return `${environment.BASE_API_URL}/stamping/referencias/`;
  }

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reference[]> {
    return this.http.get<Reference[]>(this.endpoint);
  }
}
