/*
  Copyright 2018 Stratumn SAS. All rights reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { fromSegmentObject, Link, Segment } from '@stratumn/js-chainscript';
import axios, { AxiosRequestConfig } from 'axios';
import { IStoreClient } from './client';
import { Pagination } from './pagination';

/**
 * StoreHttpClient provides access to the Chainscript Store API via HTTP
 * requests.
 * Your application should use a single instance of this client, because it
 * opens a websocket with the store server to receive notifications.
 */
export class StoreHttpClient implements IStoreClient {
  private storeUrl: string;
  private reqConfig: AxiosRequestConfig;

  /**
   * Create an http client to interact with a Chainscript Store.
   * @param url of the store API.
   */
  constructor(url: string) {
    if (url.endsWith('/')) {
      this.storeUrl = url.substring(0, url.length - 1);
    } else {
      this.storeUrl = url;
    }

    this.reqConfig = {
      timeout: 10000,
      // We want to handle http errors ourselves.
      validateStatus: undefined
    };
  }

  public async info(): Promise<void> {
    const response = await axios.get(this.storeUrl, this.reqConfig);
    this.handleHttpErr(response);

    return response.data.adapter;
  }

  public async createLink(link: Link): Promise<Segment> {
    const response = await axios.post(
      this.storeUrl + '/links',
      link.toObject({ bytes: String }),
      this.reqConfig
    );
    this.handleHttpErr(response);

    const segment = fromSegmentObject(response.data);
    return segment;
  }

  public async getSegment(linkHash: string): Promise<Segment | null> {
    const response = await axios.get(
      this.storeUrl + '/segments/' + linkHash,
      this.reqConfig
    );
    if (response.status === 404) {
      return null;
    }
    this.handleHttpErr(response);

    const segment = fromSegmentObject(response.data);
    return segment;
  }

  public async getMapIDs(
    process?: string,
    pagination?: Pagination
  ): Promise<string[]> {
    let url = this.storeUrl + '/maps?';
    if (process) {
      url += 'process=' + process + '&';
    }
    if (pagination) {
      url += 'offset=' + pagination.Offset + '&limit=' + pagination.Limit;
    } else {
      url += 'offset=0&limit=25';
    }

    const response = await axios.get(url, this.reqConfig);
    if (response.status === 404) {
      return [];
    }
    this.handleHttpErr(response);

    return response.data;
  }

  /**
   * Handle potential http errors and throw accordingly.
   * @param response http response.
   */
  private handleHttpErr(response: any) {
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
