import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/qr.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

/// QR codes recognized within an asset
///
/// State is stored in the local DB, and is only written by sync
extension type const QrStore._(Provider<QrMutations> _provider) implements Provider<QrMutations> {
  /// Internal: access through `Store.qr`
  static final QrStore instance = QrStore._(Provider((ref) => QrMutations._(ref)));

  /// The visible QR codes recognized within the asset [assetId]
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the local DB
  AutoDisposeFutureProvider<List<Qr>> forAsset(String assetId) => _forAssetProvider(assetId);
}

final _qrDb = driftProvider.select((db) => db.qrRepository);

final _forAssetProvider = FutureProvider.autoDispose.family<List<Qr>, String>(
  (ref, assetId) => ref.watch(_qrDb).get(assetId),
);

class QrMutations extends StoreMutations {
  const QrMutations._(super.ref);
}
