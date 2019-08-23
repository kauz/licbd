import * as path from 'path'
import * as fs from 'fs'
import * as cv from 'opencv4nodejs'
import { drawBlueRect, drawPolygon } from './utils';
import { extractResults } from './dnn/ssdUtils';
import { Mat, Net, Point2 } from 'opencv4nodejs';
import { rectsToPolygons } from './rectsToPolygons';
import * as nms from './modules/nms/nms';
import * as malisiewicz from './modules/nms/malisiewicz'

// if (!cv.xmodules.dnn) {
//   throw new Error('exiting: opencv4nodejs compiled without dnn module');
// }

const modelPath = path.resolve(__dirname,
  'data/frozen_east_text_detection.pb');
const imgPath = path.resolve(__dirname, 'data/2019-08-19_1451.jpg');

if (!fs.existsSync(modelPath)) {
  console.log('could not find EAST model');
  console.log('download the model from: https://github.com/oyyd/frozen_east_text_detection.pb/blob/71415464412c55bb1d135fcdeda498e29a67effa/frozen_east_text_detection.pb?raw=true'
    + ' or create a .pb model from https://github.com/argman/EAST');
  throw new Error('exiting: could not find EAST model');
}

const MIN_CONFIDENCE = 0.5;
const NMS_THRESHOLD = 0.4;
const SIZE = 320;

function decode(scores: Mat, geometry: Mat, confThreshold: number): any {
  const [numRows, numCols] = scores.sizes.slice(2);
  const boxes = [];
  const confidences = [];
  const baggage = [];


  for (let y = 0; y < numRows; y += 1) {
    for (let x = 0; x < numCols; x += 1) {
      const score = scores.at([0, 0, y, x]);

      if (score < MIN_CONFIDENCE) {
        continue;
      }
      const dTop = geometry.at([0, 0, y, x]);
      const dRight = geometry.at([0, 1, y, x]);
      const dBottom = geometry.at([0, 2, y, x]);
      const dLeft = geometry.at([0, 3, y, x]);
      const angle = geometry.at([0, 4, y, x]);

      const offsetX = x * 4;
      const offsetY = y * 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // const h = geometry.at([0, 0, y, x]) + geometry.at([0, 2, y, x]);
      // const w = geometry.at([0, 1, y, x]) + geometry.at([0, 3, y, x]);

      const upperRight = [offsetX + dRight, offsetY - dTop];
      const lowerRight = [offsetX + dRight, offsetY + dBottom];
      const upperLeft = [offsetX - dLeft, offsetY - dTop];
      const lowerLeft = [offsetX - dLeft, offsetY + dBottom];

      //
      // const endX = offsetX + (cos * geometry.at([0, 1, y, x])) + (sin * geometry.at([0, 2, y, x]));
      // console.log(endX);
      // const endY = offsetY - (sin * geometry.at([0, 1, y, x])) + (cos * geometry.at([0, 2, y, x]));
      // const startX = endX - w;
      // const startY = endY - h;

      boxes.push(new cv.Rect(
        upperLeft[0], // x
        upperLeft[1], // y
        lowerRight[0]-upperLeft[0],
        lowerRight[1]-upperLeft[1],
      ));
      confidences.push(score);
      baggage.push({
        angle,
        upperRight,
        lowerRight,
        upperLeft,
        lowerLeft,
        dTop,
        dRight,
        dBottom,
        dLeft,
        offset: [offsetX, offsetY],
      });
    }
  }

  return [boxes, confidences, baggage];
}

function detection(modelAbsPath: string, imgAbsPath: string) {
  const net: Net = cv.readNetFromTensorflow(modelPath);
  const img: Mat = cv.imread(imgAbsPath);
  const [imgHeight, imgWidth] = img.sizes;
  const widthRatio = imgWidth / SIZE;
  const heightRatio = imgHeight / SIZE;

  const inputBlob = cv.blobFromImage(img, 1,
    new cv.Size(SIZE, SIZE), new cv.Vec3(123.68, 116.78, 103.94), true, false);

  net.setInput(inputBlob);

  const outBlobNames = [
    'feature_fusion/Conv_7/Sigmoid',
    'feature_fusion/concat_3',
  ];

  const [scores, geometry] = net.forward(outBlobNames);
  const [boxes, confidences, baggage] = decode(scores, geometry, MIN_CONFIDENCE);

  const offsets = [];
  const thetas = [];
  for (const b of baggage) {
    offsets.push(b.offset);
    thetas.push(b.angle);
  }

  const polygons = rectsToPolygons(boxes, thetas, offsets, widthRatio, heightRatio);
  const indicesNew = nms.polygons(polygons, confidences, malisiewicz.nms, MIN_CONFIDENCE, NMS_THRESHOLD);

  const indices = cv.NMSBoxes(
    boxes,
    confidences, MIN_CONFIDENCE, NMS_THRESHOLD
  );

  // indices.forEach((i: number) => {
  //   const rect = boxes[i];
  //   const imgRect = new cv.Rect(
  //     rect.x * widthRatio,
  //     rect.y * heightRatio,
  //     rect.width * widthRatio,
  //     rect.height * heightRatio,
  //   );
  //   drawBlueRect(img, imgRect);
  // });

  indices.forEach((i: number) => {
    const points = polygons[i];
    const polygon: Point2[][] = [[]];

    points.forEach(arr => {
      polygon[0].push(new Point2(arr[0], arr[1]));
      return
    });

    // console.log(polygon);

    drawPolygon(img, polygon);
  });

  cv.imshowWait('EAST text detection', img);
}

detection(
  modelPath,
  imgPath
);


function polygonToPoint2(polygon: number[][]): Point2[][] {
  return polygon.map((arr: number[]) => {
    return [new Point2(arr[0], arr[1])];
  });
}
