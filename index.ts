import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

import { get } from 'lodash';
import { join } from 'path';
import request from 'request'
import { createWriteStream } from 'fs';
import { CronicleUtils } from '@bytebrand/cronicle-helper';
import { ImageImboRequest } from '@bytebrand/autode-request';
import { SearchEndpointRequest } from './modules';

const CARS_COUNT = 2000;
export const sApiUrl = process.env.SEARCH_ENDPOINT_URL;
export const iApiUrl = process.env.IMAGE_IMBO_URL;
export const iApiKey = process.env.IMAGE_IMBO_KEY;
const searchReq = new SearchEndpointRequest('', sApiUrl);
const imboReq = new ImageImboRequest(iApiKey, iApiUrl);

const masterData: any[] = [];
const rootPath = (fileName: string) => join('resources', fileName);

setImmediate(async () => {
  try {

    let offset = 0;
    let limit = 15;

    while (masterData.length < CARS_COUNT) {
      const { data } = await searchReq.searchCars({
        offset,
        limit,
        sortField: 'dates.metaData_creationDate',
        sortDirection: 'desc'
      });

      for (let i = 0; i < data.length; i++) {
        const car = data[i];

        const imagesCount = get(car, 'metaData.imagesCount');
        const imagesByApp = get(car, 'metaData.imagesByApp');

        if (!imagesCount || imagesByApp) {
          continue;
        }

        const carId = get(car, '_id');

        const images = (await getImagesInfo(carId)).map(o => {
          return { id: o.imageIdentifier, number: Number(o.metadata.image_code.replace('simple_', ''))}
        });

        images.forEach(async img => {
          await fetchImage(carId, img.id, imagesCount, img.number);
        });

        masterData.push({ carId, imagesCount, images });
        console.log(`Progress: ${masterData.length / CARS_COUNT}`);

      }

      offset += 15;

    }

    await CronicleUtils.writeJSON(rootPath('masterData.json'), masterData);

  } catch (e) {
    console.error(e);
  }
});

async function getImagesInfo(carId: string): Promise<any[]> {
  try {
    const imageInfo = await CronicleUtils.retry(() => {
      return imboReq.getCleanedCarImages(carId, { 'fields[]': ['imageIdentifier', 'metadata'], limit: 0, metadata: 1, cleaned: true });
    }, 10, 2000, true);
    return get(imageInfo, 'images', []);
  } catch (e) {
    return [];
  }
}

function fetchImage(carId: string, imageId: string, count: number, imageNumber: number) {
  const imageUrl = `https://images.auto.de/carimage/${carId}/${imageId}/large`;
  const fileName = rootPath(`images/${carId}:${imageId}:${count}:${imageNumber}.webp`);
  return new Promise(((resolve, reject) => {

    const loader = request(imageUrl).pipe(createWriteStream(fileName));

    loader.on('close', () => {
      resolve(0);
    });

    loader.on('error', (e: any) => {
      reject(e);
    })

  }));
}
