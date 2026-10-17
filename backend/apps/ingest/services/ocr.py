from dataclasses import dataclass, field

from django.conf import settings


@dataclass
class OcrResult:
    text: str = ""
    confidence: float = 0.0
    lines: list[str] = field(default_factory=list)


def ocr_image(path: str) -> OcrResult:
    if not settings.OCR_ENABLED:
        return OcrResult()
    try:
        from rapidocr_onnxruntime import RapidOCR
    except ImportError:
        return OcrResult()
    engine = RapidOCR()
    result, _ = engine(path)
    if not result:
        return OcrResult()
    lines = [item[1] for item in result]
    scores = [float(item[2]) for item in result if len(item) > 2]
    return OcrResult(
        text="\n".join(lines),
        confidence=sum(scores) / len(scores) if scores else 0.0,
        lines=lines,
    )
