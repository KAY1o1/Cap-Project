import unittest

from topic_generator import extract_topics


class TopicGeneratorTests(unittest.TestCase):
    def test_ranks_words_used_across_multiple_notes(self) -> None:
        topics = extract_topics(
            [
                {
                    "content": "Golden retriever dogs need daily exercise.",
                    "timestamp_seconds": 15,
                },
                {
                    "content": "A golden retriever is known for friendly behavior.",
                    "timestamp_seconds": 42,
                },
            ]
        )

        retriever_topic = next(
            topic for topic in topics if topic["term"] == "retriever"
        )
        self.assertEqual(retriever_topic["note_count"], 2)
        self.assertEqual(retriever_topic["timestamps"], [15, 42])

    def test_omits_common_words(self) -> None:
        topics = extract_topics(
            [
                {
                    "content": "This is a note about puppies.",
                    "timestamp_seconds": 0,
                }
            ]
        )

        self.assertEqual([topic["term"] for topic in topics], ["puppies", "note"])


if __name__ == "__main__":
    unittest.main()
