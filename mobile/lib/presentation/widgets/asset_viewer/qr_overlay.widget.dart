import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/qr.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:url_launcher/url_launcher.dart';

class QrOverlay extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final Size imageSize;
  final Size viewportSize;
  final PhotoViewControllerBase? controller;

  const QrOverlay({
    super.key,
    required this.asset,
    required this.imageSize,
    required this.viewportSize,
    this.controller,
  });

  @override
  ConsumerState<QrOverlay> createState() => _QrOverlayState();
}

class _QrOverlayState extends ConsumerState<QrOverlay> {
  int? _selectedBoxIndex;

  // Current transform read from the PhotoView controller.
  // Null until the controller has emitted at least one real event or until
  // we can seed a reliable value from controller.value on init.
  PhotoViewControllerValue? _controllerValue;
  StreamSubscription<PhotoViewControllerValue>? _controllerSub;

  @override
  void initState() {
    super.initState();
    _attachController(widget.controller);
  }

  @override
  void didUpdateWidget(QrOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _detachController();
      _attachController(widget.controller);
    }
  }

  @override
  void dispose() {
    _detachController();
    super.dispose();
  }

  void _attachController(PhotoViewControllerBase? controller) {
    if (controller == null) {
      return;
    }

    // Seed with the current value only when scaleBoundaries is already set.
    // Before the image finishes loading, PhotoView uses childSize = outerSize
    // (viewport) as a placeholder, which sets scale = 1.0.  That placeholder
    // is wrong for any image that doesn't exactly fill the viewport.
    // Once scaleBoundaries is set the value is trustworthy (the image has rendered
    // at least one frame and setScaleInvisibly has been called with the real
    // initial/zoomed scale).
    if (controller.scaleBoundaries != null) {
      _controllerValue = controller.value;
    }

    _controllerSub = controller.outputStateStream.listen((value) {
      if (mounted) {
        setState(() => _controllerValue = value);
      }
    });
  }

  void _detachController() {
    unawaited(_controllerSub?.cancel());
    _controllerSub = null;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final qrData = ref.watch(Store.qr.forAsset((widget.asset as RemoteAsset).id));

    return qrData.when(
      data: (data) {
        if (data.isEmpty) {
          return const SizedBox.shrink();
        }
        return _QrBoxes(
          qrData: data,
          controller: widget.controller,
          imageSize: widget.imageSize,
          viewportSize: widget.viewportSize,
          controllerValue: _controllerValue,
          selectedBoxIndex: _selectedBoxIndex,
          onSelectionChanged: (index) => setState(() => _selectedBoxIndex = index),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _QrBoxes extends StatelessWidget {
  final List<Qr> qrData;
  final PhotoViewControllerBase? controller;
  final Size imageSize;
  final Size viewportSize;
  final PhotoViewControllerValue? controllerValue;
  final int? selectedBoxIndex;
  final ValueChanged<int?> onSelectionChanged;

  const _QrBoxes({
    required this.qrData,
    required this.controller,
    required this.imageSize,
    required this.viewportSize,
    required this.controllerValue,
    required this.selectedBoxIndex,
    required this.onSelectionChanged,
  });

  @override
  Widget build(BuildContext context) {
    // Use the actual decoded image size from PhotoView's scaleBoundaries when
    // available. The image provider may serve a downscaled preview (e.g. Immich
    // serves a ~1440px preview for large originals), so the decoded dimensions
    // can differ significantly from the stored asset dimensions. Using the wrong
    // size would scale every coordinate by the ratio between the two resolutions.
    final resolvedImageSize = controller?.scaleBoundaries?.childSize ?? imageSize;

    final scale =
        controllerValue?.scale ??
        math.min(viewportSize.width / resolvedImageSize.width, viewportSize.height / resolvedImageSize.height);
    final position = controllerValue?.position ?? Offset.zero;

    final imageWidth = resolvedImageSize.width;
    final imageHeight = resolvedImageSize.height;
    final viewportWidth = viewportSize.width;
    final viewportHeight = viewportSize.height;

    // Image center in viewport space, accounting for pan
    final cx = viewportWidth / 2 + position.dx;
    final cy = viewportHeight / 2 + position.dy;

    final quads = <List<Offset>>[];
    final boxes = <Widget>[];

    for (final entry in qrData.asMap().entries) {
      final index = entry.key;
      final qr = entry.value;

      // Map normalized image coords (0–1) to viewport space
      final x1 = cx + (qr.x1 - 0.5) * imageWidth * scale;
      final y1 = cy + (qr.y1 - 0.5) * imageHeight * scale;
      final x2 = cx + (qr.x2 - 0.5) * imageWidth * scale;
      final y2 = cy + (qr.y2 - 0.5) * imageHeight * scale;
      final x3 = cx + (qr.x3 - 0.5) * imageWidth * scale;
      final y3 = cy + (qr.y3 - 0.5) * imageHeight * scale;
      final x4 = cx + (qr.x4 - 0.5) * imageWidth * scale;
      final y4 = cy + (qr.y4 - 0.5) * imageHeight * scale;

      // Bounding rectangle for hit testing and Positioned placement
      final minX = [x1, x2, x3, x4].reduce((a, b) => a < b ? a : b);
      final maxX = [x1, x2, x3, x4].reduce((a, b) => a > b ? a : b);
      final minY = [y1, y2, y3, y4].reduce((a, b) => a < b ? a : b);
      final maxY = [y1, y2, y3, y4].reduce((a, b) => a > b ? a : b);

      quads.add([Offset(x1, y1), Offset(x2, y2), Offset(x3, y3), Offset(x4, y4)]);

      boxes.add(
        _QrBoxItem(
          key: ValueKey(index),
          qr: qr,
          index: index,
          isSelected: selectedBoxIndex == index,
          points: [
            Offset(x1 - minX, y1 - minY),
            Offset(x2 - minX, y2 - minY),
            Offset(x3 - minX, y3 - minY),
            Offset(x4 - minX, y4 - minY),
          ],
          left: minX,
          top: minY,
          width: maxX - minX,
          height: maxY - minY,
          angle: math.atan2(y2 - y1, x2 - x1),
          labelDx: (minX + maxX) / 2 - minX,
          labelDy: (minY + maxY) / 2 - minY,
          onSelectionChanged: onSelectionChanged,
        ),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () => onSelectionChanged(null),
      child: ClipRect(
        child: Stack(
          children: [
            // Fills the viewport so taps outside boxes deselect
            SizedBox(width: viewportWidth, height: viewportHeight),
            // Dark scrim with the QR boxes punched out
            Positioned.fill(
              child: IgnorePointer(
                child: CustomPaint(painter: _QrScrimPainter(quads: quads)),
              ),
            ),
            ...boxes,
          ],
        ),
      ),
    );
  }
}

class _QrBoxItem extends StatelessWidget {
  final Qr qr;
  final int index;
  final bool isSelected;
  final List<Offset> points;
  final double left;
  final double top;
  final double width;
  final double height;
  final double angle;
  final double labelDx;
  final double labelDy;
  final ValueChanged<int?> onSelectionChanged;

  const _QrBoxItem({
    super.key,
    required this.qr,
    required this.index,
    required this.isSelected,
    required this.points,
    required this.left,
    required this.top,
    required this.width,
    required this.height,
    required this.angle,
    required this.labelDx,
    required this.labelDy,
    required this.onSelectionChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: left,
      top: top,
      child: GestureDetector(
        onTap: () {
          onSelectionChanged(index);
          unawaited(_openQrDialog(context));
        },
        behavior: HitTestBehavior.translucent,
        child: SizedBox(
          width: width,
          height: height,
          child: Stack(
            children: [
              CustomPaint(
                painter: _QrBoxPainter(
                  points: points,
                  isSelected: isSelected,
                  colorScheme: context.themeData.colorScheme,
                ),
                size: Size(width, height),
              ),
              if (!isSelected)
                Center(
                  child: Icon(
                    Icons.qr_code_2,
                    color: Colors.white.withValues(alpha: 0.85),
                    size: math.max(12, math.min(width, height) * 0.5),
                  ),
                ),
              if (isSelected)
                Positioned(
                  left: labelDx,
                  top: labelDy,
                  child: FractionalTranslation(
                    translation: const Offset(-0.5, -0.5),
                    child: Transform.rotate(
                      angle: angle,
                      alignment: Alignment.center,
                      child: Container(
                        margin: const EdgeInsets.all(2),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey[800]?.withValues(alpha: 0.4),
                          borderRadius: const BorderRadius.all(Radius.circular(4)),
                        ),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(maxWidth: math.max(50, width), maxHeight: math.max(20, height)),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: SelectableText(
                              qr.payload,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: math.max(12, height * 0.6),
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openQrDialog(BuildContext context) async {
    final payload = qr.payload;
    final isUrl = payload.startsWith('http://') || payload.startsWith('https://');

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.t.qr_payload),
        content: SelectableText(payload),
        actions: [
          if (isUrl)
            FilledButton(onPressed: () => unawaited(_openPayload(dialogContext)), child: Text(context.t.qr_open_link))
          else
            TextButton(onPressed: () => unawaited(_copyPayload(dialogContext)), child: Text(context.t.qr_copy_payload)),
          TextButton(onPressed: () => dialogContext.pop(), child: Text(context.t.cancel)),
        ],
      ),
    );
  }

  Future<void> _openPayload(BuildContext context) async {
    final url = Uri.parse(qr.payload);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      if (context.mounted) {
        context.pop();
      }
    }
  }

  Future<void> _copyPayload(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: qr.payload));
    if (context.mounted) {
      ImmichToast.show(context: context, msg: context.t.qr_copied, toastType: ToastType.info);
      context.pop();
    }
  }
}

class _QrScrimPainter extends CustomPainter {
  final List<List<Offset>> quads;

  const _QrScrimPainter({required this.quads});

  @override
  void paint(Canvas canvas, Size size) {
    // Fill the whole viewport, then subtract each QR quad using the even-odd
    // rule so the original image shows through the boxes.
    final path = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size);

    for (final quad in quads) {
      path
        ..moveTo(quad[0].dx, quad[0].dy)
        ..lineTo(quad[1].dx, quad[1].dy)
        ..lineTo(quad[2].dx, quad[2].dy)
        ..lineTo(quad[3].dx, quad[3].dy)
        ..close();
    }

    canvas.drawPath(path, Paint()..color = Colors.black54);
  }

  @override
  bool shouldRepaint(_QrScrimPainter oldDelegate) => true;
}

class _QrBoxPainter extends CustomPainter {
  final List<Offset> points;
  final bool isSelected;
  final ColorScheme colorScheme;

  const _QrBoxPainter({required this.points, required this.isSelected, required this.colorScheme});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isSelected ? colorScheme.primary : colorScheme.secondary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final fillPaint = Paint()
      ..color = isSelected ? colorScheme.primary.withValues(alpha: 0.45) : Colors.transparent
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(points[0].dx, points[0].dy)
      ..lineTo(points[1].dx, points[1].dy)
      ..lineTo(points[2].dx, points[2].dy)
      ..lineTo(points[3].dx, points[3].dy)
      ..close();

    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_QrBoxPainter oldDelegate) {
    return oldDelegate.isSelected != isSelected || !listEquals(oldDelegate.points, points);
  }
}
