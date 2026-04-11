import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistoriqueRetour } from '../models/historique.model';

@Injectable({ providedIn: 'root' })
export class HistoriqueService {
  private url = `${environment.apiUrl}/historique`;

  constructor(private http: HttpClient) {}

  getByRetourId(id: number): Observable<HistoriqueRetour[]> {
    return this.http.get<HistoriqueRetour[]>(`${this.url}/retour/${id}`);
  }

  getRecent(): Observable<HistoriqueRetour[]> {
    return this.http.get<HistoriqueRetour[]>(`${this.url}/recent`);
  }
}
