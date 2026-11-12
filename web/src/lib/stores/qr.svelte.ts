import { assetCacheManager } from '#lib/managers/AssetCacheManager.svelte.ts';
import { CancellableTask } from '#lib/utils/cancellable-task.ts';

export type QrBoundingBox = {
  id: string;
  assetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
  payload: string;
};

class QrManager {
  #data = $state<QrBoundingBox[]>([]);
  showOverlay = $state(false);
  #hasQrData = $derived(this.#data.length > 0);
  #qrLoader = new CancellableTask();
  #cleared = false;

  get data() {
    return this.#data;
  }

  get hasQrData() {
    return this.#hasQrData;
  }

  async getAssetQr(id: string) {
    if (this.#cleared) {
      await this.#qrLoader.reset();
      this.#cleared = false;
    }
    await this.#qrLoader.execute(async () => {
      this.#data = await assetCacheManager.getAssetQr(id);
    }, false);
  }

  clear() {
    this.#cleared = true;
    this.#data = [];
    this.showOverlay = false;
  }

  toggleQrBoundingBox() {
    this.showOverlay = !this.showOverlay;
  }
}

export const qrManager = new QrManager();
