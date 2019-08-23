import assert from 'assert';
import { isNil } from 'lodash';
import { Contour } from 'opencv4nodejs';
import { getMaxScoreIndex, polygonIntersectionArea } from './helpers';

// @ts-ignore
export function nms(boxes, scores, scoreThreshold, nmsThreshold, compareFunction, areaFunction, topK = 0): number[] {
    if (boxes.length === 0) {
        return [];
    }

    if (!isNil(scores)) {
        assert(scores.length === boxes.length);
    }

    // initialize the list of picked indexes
    const pick: number[] = [];
    // compute the area of the bounding boxes and sort the bounding
    // boxes by the bottom-right y-coordinate of the bounding box
    const areas = areaFunction(boxes);

    let idxs: number[] = [];

    // sort the boxes by score or the bottom-right y-coordinate of the bounding box
    if(!isNil(scores)) {
        // sort the bounding boxes by the associated scores
        const maxScores = getMaxScoreIndex(scores, scoreThreshold, topK, false);
        idxs = maxScores.map(a => a[1]);
    } else {
        idxs = boxes.map((val: number[][], idx: number) => idx);
    }

    // keep looping while some indexes still remain in the indexes
    let tempC = 0;
    while (idxs.length > 0) {
        // grab the last index in the indexes list and add the index value to the list of picked indexes
        const last = idxs.length - 1;
        const i = idxs[last];
        pick.push(i);

        // compute the ratio of overlap
        const compareBoxes = boxes.filter((v: any, i: number) => idxs.includes(i));
        const compareAreas = areas.filter((v: any, i: number) => idxs.includes(i));
        const overlap = polyCompare(boxes[i], compareBoxes, compareAreas);

        tempC += 1;
        if (tempC > 5) {
            break;
        }
    }



    return pick;
}

/** Calculate the intersection of poly1 to polygons divided by area
 *
 * @param poly1 a polygon specified by a list of its verticies
 * @param polygons a list of polygons, each specified a list of its verticies
 * @param area a list of areas of the corresponding polygons
 */
// @ts-ignore
export function polyCompare(poly1, polygons, area) {
    const overlap = [];
    for (let i = 0; i < polygons.length; i++) {
        const poly2 = polygons[i];
        // const intersectionArea = polygonIntersectionArea([poly1, poly2]);
        // overlap.push(intersectionArea / area[i]);
    }
    // return overlap;
}

/** Calculate the area of the list of polygons
 *
 * @param polys
 * @returns array of areas of the polygons
 */
export function polyAreas(polys: number[][][]) {
    const areas = [];
    for (const poly of polys) {
        const contour: Contour = new Contour(poly);
        areas.push(contour.area);
    }
    return areas;
}
