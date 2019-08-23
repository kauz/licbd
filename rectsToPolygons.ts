import { Rect } from 'opencv4nodejs';

/**
 * Convert rectangles (x,y, w, h) into polygons [(x0,y0), (x1, y1), (x2, y2), (x3, y3])
 *
 * @param rects a list of rectangles, ------>>> each specified as (x, y, w, h)
 * @param thetas the angle of rotation for each rectangle in radians
 * @param origins the points to rotate each rectangle around
 * @param ratioWidth optional width scaling factor, default 1.0
 * @param ratioHeight optional height scaling factor, default 1.0
 * @returns a list of polygons, each specified by its [x,y] vertices
 */
export function rectsToPolygons(rects: Rect[], thetas: number[], origins: number[][], ratioWidth: number = 1, ratioHeight: number = 1) {
  const polygons = [];

  for (let i = 0; i < rects.length; i++) {
    let upperLeftX = rects[i]['x'];
    let upperLeftY = rects[i]['y'];
    let lowerRightX = upperLeftX + rects[i]['width'];
    let lowerRightY = upperLeftY + rects[i]['height'];

    // scale the bounding box coordinates based on the respective ratios
    upperLeftX = upperLeftX * ratioWidth;
    upperLeftY = upperLeftY * ratioHeight;
    lowerRightX = lowerRightX * ratioWidth;
    lowerRightY = lowerRightY * ratioHeight;

    // create an array of the rectangle's verticies
    const points = [
      [upperLeftX, upperLeftY],
      [lowerRightX, upperLeftY],
      [lowerRightX, lowerRightY],
      [upperLeftX, lowerRightY],
    ];

    // the offset is the point at which the rectangle is rotated
    const rotationPoint = [origins[i][0] * ratioWidth, origins[i][1] * ratioHeight];
    polygons.push(rotatePoints(points, thetas[i], rotationPoint));
  }

  return polygons;
}

/**
 * Rotate the list of points theta radians around origin

 * @param points array of points, each given as [x,y]
 * @param theta the angle to rotate the points in radians
 * @param origin the point about which the points are to be rotated
 * @returns array of rotated points
 */
function rotatePoints(points: number[][], theta: number, origin: number[]) {
  const rotated = [];

  for (const xy of points) {
    rotated.push(rotateAroundPoint(xy, theta, origin));
  }

  return rotated;
}

/** Rotate a point around a given point.
 *  Adapted from `LyleScott/rotate_2d_point.py` <https://gist.github.com/LyleScott/e36e08bfb23b1f87af68c9051f985302>`_
 *
 * @param xy the [x,y] point to rotate
 * @param radians the angle in radians to rotate
 * @param origin the point to rotate around, defaults to (0,0)
 * @returns the rotated point
 */
function rotateAroundPoint(xy: number[], radians: number, origin: number[] = [0, 0]) {
  const [x, y] = xy;
  const [offsetX, offsetY] = origin;
  const adjustedX = x - offsetX;
  const adjustedY = y - offsetY;
  const cosRad = Math.cos(radians);
  const sinRad = Math.sin(radians);
  const qx = offsetX + cosRad * adjustedX + sinRad * adjustedY;
  const qy = offsetY + -sinRad * adjustedX + cosRad * adjustedY;

  return [qx, qy]
}
