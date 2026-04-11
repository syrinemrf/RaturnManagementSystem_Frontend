import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NonConformite, NonConformiteRequest } from '../models/nonconformite.model';

@Injectable({ providedIn: 'root' })
export class NonConformiteService {
  private url = `${environment.apiUrl}/non-conformites`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<NonConformite[]> {
    return this.http.get<NonConformite[]>(this.url);
  }

  getById(id: number): Observable<NonConformite> {
    return this.http.get<NonConformite>(`${this.url}/${id}`);
  }

  getByRetourId(retourId: number): Observable<NonConformite[]> {
    return this.http.get<NonConformite[]>(`${this.url}/retour/${retourId}`);
  }

  create(req: NonConformiteRequest): Observable<NonConformite> {
    return this.http.post<NonConformite>(this.url, req);
  }

  update(id: number, req: NonConformiteRequest): Observable<NonConformite> {
    return this.http.put<NonConformite>(`${this.url}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
