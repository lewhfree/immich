import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';

class QrToggleButton extends ConsumerWidget {
  final BaseAsset asset;
  const QrToggleButton({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    final hasQr = asset is RemoteAsset && ref.watch(Store.qr.forAsset(asset.id)).valueOrNull?.isNotEmpty == true;
    final showingQr = ref.watch(assetViewerProvider.select((s) => s.showingQr));

    return AnimatedSwitcher(
      duration: Durations.short4,
      child: !hasQr
          ? const SizedBox.shrink()
          : Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 32, bottom: 8),
                child: Material(
                  color: showingQr ? context.primaryColor : Colors.black.withValues(alpha: 0.4),
                  shape: const CircleBorder(),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: ref.watch(assetViewerProvider.notifier).toggleQr,
                    child: const Padding(
                      padding: EdgeInsets.all(10.0),
                      child: Icon(Icons.qr_code_2, size: 22, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
