"""extract topic"""

from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import re
from typing import Iterable

# load words https://countwordsfree.com/stopwords
def load_stop_words(file_path: str | Path = "stop-words.txt") -> set[str]:
    path = Path(file_path)
    if not path.exists():
        return set()

    with open(path, "r", encoding="utf-8") as f:
        return {line.strip().lower() for line in f if line.strip()}


STOP_WORDS = load_stop_words()
# allows words with hyphens and apostrophes
WORD_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z'-]*")

# small words + stop words get removed
def _words(text: str) -> Iterable[str]:
    for word in WORD_PATTERN.findall(text.lower()):
        normalized = word.strip("'-")
        if len(normalized) >= 3 and normalized not in STOP_WORDS:
            yield normalized


def extract_topics(notes: list[dict[str, object]], limit: int = 6) -> list[dict[str, object]]:
    mentions: Counter[str] = Counter()
    note_counts: Counter[str] = Counter()
    timestamps: dict[str, list[int]] = defaultdict(list)

    # rank words by mentions
    for note in notes:
        words = set(_words(str(note["content"])))
        timestamp = note.get("timestamp_seconds")
        for word in words:
            note_counts[word] += 1
            if isinstance(timestamp, int) and timestamp not in timestamps[word]:
                timestamps[word].append(timestamp)

        # cap at 30 words within a note
        for word in list(_words(str(note["content"])))[:30]:
            mentions[word] += 1

    ranked = sorted(
        mentions,
        key=lambda word: (mentions[word] + note_counts[word], note_counts[word], len(word)),
        reverse=True,
    )

    return [
        {
            "term": word,
            "mention_count": mentions[word],
            "note_count": note_counts[word],
            "timestamps": sorted(timestamps[word])[:5],
        }
        for word in ranked[:limit]
    ]
