import { Column, CreateDateColumn, Table, type Generated } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';

@Table('asset_qr_audit')
export class AssetQrAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Date;
}
