import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators.js';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum.js';
import { QR } from 'src/repositories/machine-learning.repository.js';
import { BaseService } from 'src/services/base.service.js';
import type { JobOf } from 'src/types.js';
import { batched, isQrEnabled } from 'src/utils/misc.js';

@Injectable()
export class QrService extends BaseService {
  @OnJob({ name: JobName.QrQueueAll, queue: QueueName.Qr })
  async handleQueueQr({ force }: JobOf<JobName.QrQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isQrEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.qrRepository.deleteAll();
    }

    for await (const assets of batched(this.assetJobRepository.streamForQrJob(force))) {
      await this.jobRepository.queueAll(assets.map((asset) => ({ name: JobName.Qr, data: { id: asset.id } })));
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.Qr, queue: QueueName.Qr })
  async handleQr({ id }: JobOf<JobName.Qr>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isQrEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForOcr(id);
    if (!asset || !asset.previewFile) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const qrResults = await this.machineLearningRepository.qr(asset.previewFile);
    const qrDataList = this.parseQrResults(id, qrResults);
    await this.qrRepository.upsert(id, qrDataList);

    await this.assetRepository.upsertJobStatus({ assetId: id, qrAt: new Date() });

    await this.eventRepository.emit('AssetQrExtracted', {
      userId: asset.ownerId,
      assetId: id,
    });

    this.logger.debug(`Processed ${qrResults.payloads.length} QR result(s) for ${id}`);
    return JobStatus.Success;
  }

  private parseQrResults(id: string, { payloads, boxes }: QR) {
    const qrDataList = [];
    for (let i = 0; i < payloads.length; i++) {
      const box = boxes[i];
      qrDataList.push({
        assetId: id,
        x1: box[0][0],
        y1: box[0][1],
        x2: box[1][0],
        y2: box[1][1],
        x3: box[2][0],
        y3: box[2][1],
        x4: box[3][0],
        y4: box[3][1],
        payload: payloads[i].slice(0, 512),
      });
    }

    return qrDataList;
  }
}
