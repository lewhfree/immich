import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'qr.model.freezed.dart';

@freezed
abstract class Qr with _$Qr {
  const factory Qr({
    required String id,
    required String assetId,
    required double x1,
    required double y1,
    required double x2,
    required double y2,
    required double x3,
    required double y3,
    required double x4,
    required double y4,
    required String payload,
    required bool isVisible,
  }) = _Qr;
}
