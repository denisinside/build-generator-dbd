import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class TrickyService {
  private readonly baseUrl = 'https://dbd.tricky.lol/api';

  constructor(private readonly httpService: HttpService) {}

  private handleRequest<T>(endpoint: string): Observable<T> {
    return this.httpService.get(`${this.baseUrl}${endpoint}`).pipe(
      map((response) => response.data),
      catchError(this.handleError),
    );
  }

  getAddons(role?: string, itemType?: string): Observable<any> {
    const params = [];
    if (role) params.push(`role=${role}`);
    if (itemType) params.push(`item_type=${itemType}`);
    const url = `/addons${params.length ? '?' + params.join('&') : ''}`;
    return this.handleRequest(url);
  }

  getCharacters(role?: string): Observable<any> {
    const url = `/characters${role ? `?role=${role}` : ''}`;
    return this.handleRequest(url);
  }

  getItems(role?: string, type?: string, itemType?: string): Observable<any> {
    const params = [];
    if (role) params.push(`role=${role}`);
    if (type) params.push(`type=${type}`);
    if (itemType) params.push(`item_type=${itemType}`);
    const url = `/items${params.length ? '?' + params.join('&') : ''}`;
    return this.handleRequest(url);
  }

  getPerks(role?: string): Observable<any> {
    const url = `/perks${role ? `?role=${role}` : ''}`;
    return this.handleRequest(url);
  }

  private handleError(error: AxiosError) {
    return throwError(
      () =>
        new HttpException(
          error.response?.data || 'Unknown error',
          error.response?.status || 500,
        ),
    );
  }
}
