import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TechnicalSheetData } from '../../models/catalog/technical-sheet-data';

@Injectable({ providedIn: 'root' })
export class TechnicalSheetDataService {
  private endpoint = `${environment.BASE_API_URL}/catalog/technical-sheets-json/`;

  constructor(private http: HttpClient) {}

  getBySheetId(sheetId: number): Observable<TechnicalSheetData> {
    return this.http.get<TechnicalSheetData>(this.endpoint, {
      params: { sheet_id: sheetId },
    });
  }
}
