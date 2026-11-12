import type { QrBoundingBox } from '#lib/stores/qr.svelte.ts';
import { mapNormalizedToContent, type Point, type Size } from '#lib/utils/container-utils.ts';

export type { Point } from '#lib/utils/container-utils.ts';

export type QrBox = {
  id: string;
  points: Point[];
  payload: string;
};

export const getQrBoundingBoxes = (qrData: QrBoundingBox[], imageSize: Size): QrBox[] => {
  const boxes: QrBox[] = [];
  for (const qr of qrData) {
    const points = [
      { x: qr.x1, y: qr.y1 },
      { x: qr.x2, y: qr.y2 },
      { x: qr.x3, y: qr.y3 },
      { x: qr.x4, y: qr.y4 },
    ].map((point) => mapNormalizedToContent(point, imageSize));

    boxes.push({
      id: qr.id,
      points,
      payload: qr.payload,
    });
  }

  const rowThreshold = imageSize.height * 0.02;
  boxes.sort((a, b) => {
    const yDifference = a.points[0].y - b.points[0].y;
    if (Math.abs(yDifference) < rowThreshold) {
      return a.points[0].x - b.points[0].x;
    }
    return yDifference;
  });

  return boxes;
};

export const getQrUrl = (payload: string): URL | null => {
  try {
    const url = new URL(payload);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

export const isQrUrl = (payload: string) => getQrUrl(payload) !== null;
