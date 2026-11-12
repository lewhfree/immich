import type { QrBoundingBox } from '#lib/stores/qr.svelte.ts';
import type { Size } from '#lib/utils/container-utils.ts';
import { getQrBoundingBoxes, getQrUrl, isQrUrl } from '#lib/utils/qr-utils.ts';

describe('getQrBoundingBoxes', () => {
  it('should scale normalized coordinates by display dimensions and keep the payload', () => {
    const qrData: QrBoundingBox[] = [
      {
        id: 'qr1',
        assetId: 'asset1',
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'https://example.com',
      },
    ];
    const imageSize: Size = { width: 1000, height: 500 };

    const boxes = getQrBoundingBoxes(qrData, imageSize);

    expect(boxes).toHaveLength(1);
    expect(boxes[0].id).toBe('qr1');
    expect(boxes[0].payload).toBe('https://example.com');
    expect(boxes[0].points).toEqual([
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 400 },
      { x: 100, y: 400 },
    ]);
  });

  it('should map full-image box to full display area', () => {
    const qrData: QrBoundingBox[] = [
      {
        id: 'qr1',
        assetId: 'asset1',
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
        x3: 1,
        y3: 1,
        x4: 0,
        y4: 1,
        payload: 'https://example.com/path',
      },
    ];
    const imageSize: Size = { width: 600, height: 400 };

    const boxes = getQrBoundingBoxes(qrData, imageSize);

    expect(boxes[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 400 },
      { x: 0, y: 400 },
    ]);
  });

  it('should sort boxes left-to-right within a row before the row below', () => {
    const qrData: QrBoundingBox[] = [
      {
        id: 'bottom',
        assetId: 'asset1',
        x1: 0.5,
        y1: 0.8,
        x2: 0.7,
        y2: 0.8,
        x3: 0.7,
        y3: 1,
        x4: 0.5,
        y4: 1,
        payload: 'bottom',
      },
      {
        id: 'rowLeft',
        assetId: 'asset1',
        x1: 0,
        y1: 0.1,
        x2: 0.3,
        y2: 0.1,
        x3: 0.3,
        y3: 0.3,
        x4: 0,
        y4: 0.3,
        payload: 'row-left',
      },
      {
        id: 'rowRight',
        assetId: 'asset1',
        x1: 0.4,
        y1: 0.12,
        x2: 0.8,
        y2: 0.12,
        x3: 0.8,
        y3: 0.32,
        x4: 0.4,
        y4: 0.32,
        payload: 'row-right',
      },
    ];
    const imageSize: Size = { width: 100, height: 100 };

    const boxes = getQrBoundingBoxes(qrData, imageSize);

    expect(boxes.map((box) => box.id)).toEqual(['rowLeft', 'rowRight', 'bottom']);
  });

  it('should return empty array for empty input', () => {
    expect(getQrBoundingBoxes([], { width: 800, height: 600 })).toEqual([]);
  });
});

describe('getQrUrl', () => {
  it('should return the URL for http payloads', () => {
    const url = getQrUrl('http://localhost');
    expect(url).not.toBeNull();
    expect(url!.protocol).toBe('http:');
    expect(url!.href).toBe('http://localhost/');
  });

  it('should return the URL for https payloads', () => {
    const url = getQrUrl('https://example.com/path?query=1');
    expect(url).not.toBeNull();
    expect(url!.protocol).toBe('https:');
    expect(url!.href).toBe('https://example.com/path?query=1');
  });

  it('should return null for javascript payloads', () => {
    expect(getQrUrl('javascript:alert(1)')).toBeNull();
  });

  it('should return null for data payloads', () => {
    expect(getQrUrl('data:text/plain,hello')).toBeNull();
  });

  it('should return null for malformed input', () => {
    expect(getQrUrl('not a url at all')).toBeNull();
  });

  it('should return null for plain text payloads', () => {
    expect(getQrUrl('hello world')).toBeNull();
  });
});

describe('isQrUrl', () => {
  it('should return true for http and https payloads', () => {
    expect(isQrUrl('http://localhost')).toBe(true);
    expect(isQrUrl('https://example.com')).toBe(true);
  });

  it('should return false for non-http(s) payloads', () => {
    expect(isQrUrl('javascript:alert(1)')).toBe(false);
    expect(isQrUrl('data:text/plain,hello')).toBe(false);
    expect(isQrUrl('not a url')).toBe(false);
    expect(isQrUrl('hello world')).toBe(false);
  });
});
