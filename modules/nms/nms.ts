import assert from 'assert';
import * as malisiewicz from './malisiewicz';

const NMS_ALGORITHMS = [malisiewicz.nms];
const DEFAULT_ALGO = malisiewicz.nms;

/** Non Maxima Suppression for polygons
 *
 * @param polys array of polygons, each described by their xy verticies
 * @param scores array of the scores associated with the polygons
 * @param nmsAlgorithm the NMS comparison function to use
 * @param confidenceThreshold
 * @param nsmThreshold
 */
// @ts-ignore
export function polygons(polys, scores, nmsAlgorithm = DEFAULT_ALGO, confidenceThreshold = 0.3, nsmThreshold = 0.4) {
  assert(NMS_ALGORITHMS.includes(nmsAlgorithm), 'Wrong nms algorithm chosen');
  assert(0 < confidenceThreshold, 'Too low threshold for scores');
  assert(0 < nsmThreshold && nsmThreshold < 1, 'Incorrect nms threshold');

  let areaFunction;
  let compareFunction;

  if (nmsAlgorithm === malisiewicz.nms) {
    areaFunction = malisiewicz.polyAreas;
    compareFunction = malisiewicz.polyCompare;
  }

  return nmsAlgorithm(polys, scores, confidenceThreshold, nsmThreshold, compareFunction, areaFunction)
}
