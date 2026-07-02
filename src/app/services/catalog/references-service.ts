import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reference } from '../../models/catalog/reference';

@Injectable({ providedIn: 'root' })
export class ReferencesService {
  private endpoint = `${environment.BASE_API_URL}/catalog/referencias/`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reference[]> {
    return this.http.get<Reference[]>(this.endpoint);
  }
}
