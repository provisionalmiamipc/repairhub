import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { ReceivedPart } from '../../shared/models/ReceivedPart';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReceivedPartsService extends BaseService<ReceivedPart> {
  protected apiUrl = `${environment.apiUrl}/api/received-parts`;
}
