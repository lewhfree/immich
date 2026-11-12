import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetQrResponseDto } from 'src/dtos/qr.dto.js';
import { DB } from 'src/schema/index.js';
import { AssetQrTable } from 'src/schema/tables/asset-qr.table.js';

@Injectable()
export class QrRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('asset_qr').selectAll('asset_qr').where('asset_qr.id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByAssetId(id: string, options?: { isVisible?: boolean }) {
    const isVisible = options === undefined || options.isVisible;

    return this.db
      .selectFrom('asset_qr')
      .selectAll('asset_qr')
      .where('asset_qr.assetId', '=', id)
      .$if(isVisible !== undefined, (qb) => qb.where('asset_qr.isVisible', '=', isVisible!))
      .execute();
  }

  deleteAll() {
    return this.db.transaction().execute(async (trx: Kysely<DB>) => {
      await sql`truncate ${sql.table('asset_qr')}`.execute(trx);
    });
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      [
        {
          assetId: DummyValue.UUID,
          x1: DummyValue.NUMBER,
          y1: DummyValue.NUMBER,
          x2: DummyValue.NUMBER,
          y2: DummyValue.NUMBER,
          x3: DummyValue.NUMBER,
          y3: DummyValue.NUMBER,
          x4: DummyValue.NUMBER,
          y4: DummyValue.NUMBER,
          payload: DummyValue.STRING,
        },
      ],
    ],
  })
  upsert(assetId: string, qrDataList: Insertable<AssetQrTable>[]) {
    let query = this.db.with('deleted_qr', (db) => db.deleteFrom('asset_qr').where('assetId', '=', assetId));
    if (qrDataList.length > 0) {
      (query as any) = query.with('inserted_qr', (db) => db.insertInto('asset_qr').values(qrDataList));
    }

    return query.selectNoFrom(sql`1`.as('dummy')).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [], []] })
  async updateQrVisibilities(
    assetId: string,
    visible: AssetQrResponseDto[],
    hidden: AssetQrResponseDto[],
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      if (visible.length > 0) {
        await trx
          .updateTable('asset_qr')
          .set({ isVisible: true })
          .where(
            'asset_qr.id',
            'in',
            visible.map((i) => i.id),
          )
          .execute();
      }

      if (hidden.length > 0) {
        await trx
          .updateTable('asset_qr')
          .set({ isVisible: false })
          .where(
            'asset_qr.id',
            'in',
            hidden.map((i) => i.id),
          )
          .execute();
      }
    });
  }
}
