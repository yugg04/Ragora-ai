import re


def _clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_paragraphs(text: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if len(paragraphs) > 1:
        return paragraphs
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def chunk_text(text: str, chunk_size: int = 1100, overlap: int = 160) -> list[str]:
    """Create semantic-ish chunks without slicing through every sentence.

    The old implementation flattened all whitespace and cut by character count.
    That made retrieval brittle because headings, paragraphs, and neighboring
    sentences lost structure. This keeps paragraph boundaries where possible and
    adds measured overlap for continuity.
    """
    cleaned = _clean_text(text)
    if not cleaned:
        return []

    units = _split_paragraphs(cleaned)
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for unit in units:
        if len(unit) > chunk_size:
            if current:
                chunks.append("\n\n".join(current).strip())
                current = []
                current_len = 0
            start = 0
            while start < len(unit):
                part = unit[start : start + chunk_size].strip()
                if part:
                    chunks.append(part)
                if start + chunk_size >= len(unit):
                    break
                start += max(1, chunk_size - overlap)
            continue

        projected = current_len + len(unit) + (2 if current else 0)
        if current and projected > chunk_size:
            chunks.append("\n\n".join(current).strip())
            carry = " ".join(current)[-overlap:].strip()
            current = [carry, unit] if carry else [unit]
            current_len = sum(len(item) for item in current) + 2 * (len(current) - 1)
        else:
            current.append(unit)
            current_len = projected

    if current:
        chunks.append("\n\n".join(current).strip())

    seen: set[str] = set()
    deduped: list[str] = []
    for chunk in chunks:
        normalized = " ".join(chunk.lower().split())
        if len(normalized) < 20 or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(chunk)
    return deduped
