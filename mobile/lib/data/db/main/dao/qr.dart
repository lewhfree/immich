import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/dao/qr.drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/asset/qr.drift.dart';
import 'package:immich_mobile/domain/models/qr.model.dart';

@DriftAccessor()
class QrRepository extends DatabaseAccessor<Drift> with $QrRepositoryMixin {
  QrRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<List<Qr>> get(String assetId) async {
    final query = _db.select(_db.assetQrEntity)
      ..where((row) => row.assetId.equals(assetId) & row.isVisible.equals(true));

    final result = await query.get();
    return result.map((e) => e.toDto()).toList();
  }
}

extension on AssetQrEntityData {
  Qr toDto() {
    return Qr(
      id: id,
      assetId: assetId,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      x3: x3,
      y3: y3,
      x4: x4,
      y4: y4,
      payload: payload,
      isVisible: isVisible,
    );
  }
}
