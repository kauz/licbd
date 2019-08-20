import * as path from 'path';
import * as cv from 'opencv4nodejs'

export const dataPath = path.resolve(__dirname, './resources/images');
export const getDataFilePath = (fileName: any) => path.resolve(dataPath, fileName);

export const grabFrames = (videoFile: any, delay: any, onFrame: any) => {
  const cap = new cv.VideoCapture(videoFile);
  let done = false;
  const intvl = setInterval(() => {
    let frame = cap.read();
    // loop back to start on end of stream reached
    if (frame.empty) {
      cap.reset();
      frame = cap.read();
    }
    onFrame(frame);

    const key = cv.waitKey(delay);
    done = key !== -1 && key !== 255;
    if (done) {
      clearInterval(intvl);
      console.log('Key pressed, exiting.');
    }
  }, 0);
};

export const runVideoDetection = (src: any, detect: any) => {
  grabFrames(src, 1, (frame: any) => {
    detect(frame);
  });
};

export const drawRectAroundBlobs = (binaryImg: any, dstImg: any, minPxSize: any, fixedRectWidth: any) => {
  const {
    centroids,
    stats
  } = binaryImg.connectedComponentsWithStats();

  // pretend label 0 is background
  for (let label = 1; label < centroids.rows; label += 1) {
    const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
    const [x2, y2] = [
      x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
      y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
    ];
    const size = stats.at(label, cv.CC_STAT_AREA);
    // @ts-ignore
    const blue = new cv.Vec(255, 0, 0);
    if (minPxSize < size) {
      dstImg.drawRectangle(
        // @ts-ignore
        new cv.Point(x1, y1),
        // @ts-ignore
        new cv.Point(x2, y2),
        { color: blue, thickness: 2 }
      );
    }
  }
};

export const drawRect = (image: any, rect: any, color: any, opts: any = { thickness: 2 }) =>
  image.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  );

export const drawBlueRect = (image: any, rect: any, opts: any = { thickness: 2 }) =>
  // @ts-ignore
  drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
export const drawGreenRect = (image: any, rect: any, opts: any = { thickness: 2 }) =>
  // @ts-ignore
  drawRect(image, rect, new cv.Vec(0, 255, 0), opts);
export const drawRedRect = (image: any, rect: any, opts: any = { thickness: 2 }) =>
  // @ts-ignore
  drawRect(image, rect, new cv.Vec(0, 0, 255), opts);
