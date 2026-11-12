import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_asset_qr_asset_id ON asset_qr_entity (asset_id)')
class AssetQrEntity extends Table with DriftDefaultsMixin {
  const AssetQrEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  RealColumn get x1 => real()();
  RealColumn get y1 => real()();

  RealColumn get x2 => real()();
  RealColumn get y2 => real()();

  RealColumn get x3 => real()();
  RealColumn get y3 => real()();

  RealColumn get x4 => real()();
  RealColumn get y4 => real()();

  TextColumn get payload => text()();

  BoolColumn get isVisible => boolean().withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}
