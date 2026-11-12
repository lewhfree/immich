import numpy as np
import numpy.typing as npt
from typing_extensions import TypedDict


class QrDecoderOutput(TypedDict):
    boxes: npt.NDArray[np.float32]
    payloads: list[str]
