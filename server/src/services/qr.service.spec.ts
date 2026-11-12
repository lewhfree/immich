import { AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum.js';
import { QrService } from 'src/services/qr.service.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { systemConfigStub } from 'test/fixtures/system-config.stub.js';
import { ServiceMocks, makeStream, newTestService } from 'test/utils.js';

describe(QrService.name, () => {
  let sut: QrService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(QrService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.assetJob.getForOcr.mockResolvedValue({
      ownerId: 'user-id',
      visibility: AssetVisibility.Timeline,
      previewFile: '/uploads/user-id/thumbs/path.jpg',
    });
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueQr', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.handleQueueQr({ force: false });

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should queue the assets without qr', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForQrJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueQr({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Qr, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForQrJob).toHaveBeenCalledWith(false);
    });

    it('should queue all the assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForQrJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueQr({ force: true });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Qr, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForQrJob).toHaveBeenCalledWith(true);
    });

    it('should delete all qr data when forcing', async () => {
      mocks.assetJob.streamForQrJob.mockReturnValue(makeStream([]));

      await sut.handleQueueQr({ force: true });

      expect(mocks.qr.deleteAll).toHaveBeenCalled();
    });
  });

  describe('handleQr', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleQr({ id: '123' })).toEqual(JobStatus.Skipped);

      expect(mocks.machineLearning.qr).not.toHaveBeenCalled();
      expect(mocks.qr.upsert).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForOcr.mockResolvedValue({
        ownerId: 'userId',
        visibility: AssetVisibility.Timeline,
        previewFile: null,
      });

      expect(await sut.handleQr({ id: asset.id })).toEqual(JobStatus.Failed);

      expect(mocks.qr.upsert).not.toHaveBeenCalled();
      expect(mocks.machineLearning.qr).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should skip invisible assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForOcr.mockResolvedValue({
        ownerId: 'userId',
        visibility: AssetVisibility.Hidden,
        previewFile: '/uploads/user-id/thumbs/path.jpg',
      });

      expect(await sut.handleQr({ id: asset.id })).toEqual(JobStatus.Skipped);

      expect(mocks.machineLearning.qr).not.toHaveBeenCalled();
      expect(mocks.qr.upsert).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForOcr.mockResolvedValue(void 0);

      expect(await sut.handleQr({ id: 'non-existent' })).toEqual(JobStatus.Failed);

      expect(mocks.machineLearning.qr).not.toHaveBeenCalled();
      expect(mocks.qr.upsert).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      const asset = AssetFactory.create();
      mocks.machineLearning.qr.mockResolvedValue({
        payloads: ['https://immich.app'],
        boxes: [
          [
            [0, 0],
            [0.5, 0],
            [0.5, 0.5],
            [0, 0.5],
          ],
        ],
      });

      expect(await sut.handleQr({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.qr).toHaveBeenCalledWith('/uploads/user-id/thumbs/path.jpg');
      expect(mocks.qr.upsert).toHaveBeenCalledWith(asset.id, [
        {
          assetId: asset.id,
          x1: 0,
          y1: 0,
          x2: 0.5,
          y2: 0,
          x3: 0.5,
          y3: 0.5,
          x4: 0,
          y4: 0.5,
          payload: 'https://immich.app',
        },
      ]);
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({ assetId: asset.id, qrAt: expect.any(Date) });
      expect(mocks.event.emit).toHaveBeenCalledWith('AssetQrExtracted', {
        userId: 'user-id',
        assetId: asset.id,
      });
    });

    it('should truncate long payloads', async () => {
      const asset = AssetFactory.create();
      const longPayload = 'a'.repeat(600);
      mocks.machineLearning.qr.mockResolvedValue({
        payloads: [longPayload],
        boxes: [
          [
            [0, 0],
            [0.5, 0],
            [0.5, 0.5],
            [0, 0.5],
          ],
        ],
      });

      expect(await sut.handleQr({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.qr.upsert).toHaveBeenCalledWith(
        asset.id,
        expect.arrayContaining([expect.objectContaining({ payload: longPayload.slice(0, 512) })]),
      );
    });
  });
});
