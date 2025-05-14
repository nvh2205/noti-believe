import { PageResponse, PhotoResponse } from '../../types/response';

export abstract class Page {
  abstract build(data: any): PageResponse;
}
export abstract class PhotoPage {
  abstract build(data: any): PhotoResponse;
}
