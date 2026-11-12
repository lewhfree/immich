import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum.js';
import { QrRepository } from 'src/repositories/qr.repository.js';
import { DB } from 'src/schema/index.js';
import { SyncTestContext } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

// eslint-disable-next-line unicorn/no-unnecessary-parameters
const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.AssetQrV1, () => {
  it('should detect and sync new asset QR', async () => {
    const { auth, user, ctx } = await setup();

    const qrRepo = ctx.get(QrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: true,
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.1,
          y1: 0.2,
          x2: 0.9,
          y2: 0.2,
          x3: 0.9,
          y3: 0.8,
          x4: 0.1,
          y4: 0.8,
          payload: 'Hello World',
          isVisible: true,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetQrV1]);
  });

  it('should update asset QR', async () => {
    const { auth, user, ctx } = await setup();

    const qrRepo = ctx.get(QrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: true,
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.1,
          y1: 0.2,
          x2: 0.9,
          y2: 0.2,
          x3: 0.9,
          y3: 0.8,
          x4: 0.1,
          y4: 0.8,
          payload: 'Hello World',
          isVisible: true,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.15,
        y1: 0.25,
        x2: 0.85,
        y2: 0.25,
        x3: 0.85,
        y3: 0.75,
        x4: 0.15,
        y4: 0.75,
        payload: 'Updated Text',
        isVisible: true,
      },
    ]);

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          deletedAt: expect.any(String),
        },
        type: 'AssetQrDeleteV1',
      },
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.15,
          y1: 0.25,
          x2: 0.85,
          y2: 0.25,
          x3: 0.85,
          y3: 0.75,
          x4: 0.15,
          y4: 0.75,
          payload: 'Updated Text',
          isVisible: true,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetQrV1]);
  });

  it('should update asset QR visibility flag', async () => {
    const { auth, user, ctx } = await setup();

    const qrRepo = ctx.get(QrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: true,
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.1,
          y1: 0.2,
          x2: 0.9,
          y2: 0.2,
          x3: 0.9,
          y3: 0.8,
          x4: 0.1,
          y4: 0.8,
          payload: 'Hello World',
          isVisible: true,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: false,
      },
    ]);

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          deletedAt: expect.any(String),
        },
        type: 'AssetQrDeleteV1',
      },
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.1,
          y1: 0.2,
          x2: 0.9,
          y2: 0.2,
          x3: 0.9,
          y3: 0.8,
          x4: 0.1,
          y4: 0.8,
          payload: 'Hello World',
          isVisible: false,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetQrV1]);
  });

  it('should sync in-place QR visibility toggles (e.g. after an asset edit)', async () => {
    const { auth, user, ctx } = await setup();

    const qrRepo = ctx.get(QrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: true,
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    const qrId = (response[0] as { data: { id: string } }).data.id;
    await ctx.syncAckAll(auth, response);

    await qrRepo.updateQrVisibilities(
      asset.id,
      [],
      [factory.assetQr({ id: qrId, assetId: asset.id, payload: 'Hello World' })],
    );

    const updatedResponse = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(updatedResponse).toEqual([
      {
        ack: expect.any(String),
        data: expect.objectContaining({
          id: qrId,
          assetId: asset.id,
          isVisible: false,
        }),
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, updatedResponse);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetQrV1]);
  });
});

describe(SyncEntityType.AssetQrDeleteV1, () => {
  it('should delete and sync asset QR', async () => {
    const { auth, user, ctx } = await setup();

    const qrRepo = ctx.get(QrRepository);
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await qrRepo.upsert(asset.id, [
      {
        assetId: asset.id,
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        payload: 'Hello World',
        isVisible: true,
      },
    ]);

    const response = await ctx.syncStream(auth, [SyncRequestType.AssetQrV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          id: expect.any(String),
          assetId: asset.id,
          x1: 0.1,
          y1: 0.2,
          x2: 0.9,
          y2: 0.2,
          x3: 0.9,
          y3: 0.8,
          x4: 0.1,
          y4: 0.8,
          payload: 'Hello World',
          isVisible: true,
        },
        type: 'AssetQrV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);

    await ctx.syncAckAll(auth, response);

    await qrRepo.upsert(asset.id, []);

    await expect(ctx.syncStream(auth, [SyncRequestType.AssetQrV1])).resolves.toEqual([
      {
        ack: expect.any(String),
        data: {
          assetId: asset.id,
          deletedAt: expect.any(String),
          id: expect.any(String),
        },
        type: 'AssetQrDeleteV1',
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
