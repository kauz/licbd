import * as querystring from 'querystring';
import { BaseRequest, RequestMethodType } from '@bytebrand/autode-request';

export class SearchEndpointRequest extends BaseRequest {
  constructor(apiKey: string, apiUrl: string) {
    super(apiKey, apiUrl);
  }

  searchCars(options: { limit?: number, offset?: number, sortField?: string, sortDirection?: string }): Promise<any> {
    const qs = querystring.stringify({ ...options });
    return this.sendRequest({
      method: RequestMethodType.POST,
      url: `${this.baseAPIUrl}/api/v1/search/car/formatted?${qs}`,
    });
  }

}

// /api/v1/search/car/formatted?limit=15&offset=0&sortField=dates.metaData_creationDate&sortDirection=desc
