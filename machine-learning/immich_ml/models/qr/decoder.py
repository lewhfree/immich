from typing import Any, ClassVar

import cv2
import numpy as np
from PIL import Image
from typing_extensions import TypeAlias

from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelIdentity, ModelSource, ModelTask, ModelType, QrDetectionOptions

from .schemas import QrDecoderOutput

Quads: TypeAlias = np.ndarray[Any, np.dtype[np.float32]]


class QrDecoder(InferenceModel[QrDetectionOptions]):
    """OpenCV decodes QR codes without a model, so this is a weight-less detector that never downloads."""

    depends: ClassVar[list[ModelIdentity]] = []
    identity: ClassVar[ModelIdentity] = (ModelType.DETECTION, ModelTask.QRCODE)
    sources: ClassVar[tuple[ModelSource, ...]] = (ModelSource.OPENCV,)

    def load(self) -> None:
        self.loaded = True

    def _predict(self, img: Image.Image, options: QrDetectionOptions) -> QrDecoderOutput:
        array = np.asarray(img)
        gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY) if array.ndim == 3 else array
        try:
            found, decoded, points, _ = cv2.QRCodeDetector().detectAndDecodeMulti(gray)
        except cv2.error:
            return self._empty()
        if not found or len(points) == 0:
            return self._empty()

        payloads: list[str] = []
        ordered: list[Quads] = []
        for payload, quad in zip(decoded, points):
            if not payload:
                continue
            payloads.append(payload)
            ordered.append(self._order_quad(np.asarray(quad, dtype=np.float32)))

        if not payloads:
            return self._empty()

        boxes = np.asarray(ordered, dtype=np.float32).reshape(-1, 4, 2)
        boxes /= np.asarray([img.width, img.height], dtype=np.float32)
        return {"boxes": boxes, "payloads": payloads}

    def _empty(self) -> QrDecoderOutput:
        return {"boxes": np.empty((0, 4, 2), dtype=np.float32), "payloads": []}

    def _order_quad(self, quad: Quads) -> Quads:
        center = quad.mean(axis=0)
        angles = np.arctan2(quad[:, 1] - center[1], quad[:, 0] - center[0])
        return quad[np.argsort(angles)]
