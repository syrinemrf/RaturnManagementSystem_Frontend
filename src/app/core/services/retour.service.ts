import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RetourProduit, RetourRequest, ChangerEtatRequest, EtatTraitement } from '../models/retour.model';

@Injectable({ providedIn: 'root' })
export class RetourService {
  private url = `${environment.apiUrl}/retours`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RetourProduit[]> {
    return this.http.get<RetourProduit[]>(this.url);
  }

  getById(id: number): Observable<RetourProduit> {
    return this.http.get<RetourProduit>(`${this.url}/${id}`);
  }

  getByEtat(etat: EtatTraitement): Observable<RetourProduit[]> {
    return this.http.get<RetourProduit[]>(`${this.url}/etat/${etat}`);
  }

  create(req: RetourRequest): Observable<RetourProduit> {
    return this.http.post<RetourProduit>(this.url, req);
  }

  update(id: number, req: RetourRequest): Observable<RetourProduit> {
    return this.http.put<RetourProduit>(`${this.url}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  changerEtat(id: number, req: ChangerEtatRequest): Observable<RetourProduit> {
    return this.http.put<RetourProduit>(`${this.url}/${id}/etat`, req);
  }
}
