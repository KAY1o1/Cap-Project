import { useEffect, useState } from 'react';

type KeyTopic = {
    term: string;
    mention_count: number;
    note_count: number;
    timestamps: number[];
};

type TopicNoteInput = {
    content: string;
    timestamp_seconds?: number;
};

type KeyTopicsPanelProps = {
    videoId: string;
    notes: TopicNoteInput[];
};

// loading/error/topics state resets whenever the video changes
export default function KeyTopicsPanel({ videoId, notes }: KeyTopicsPanelProps) {
    const [keyTopics, setKeyTopics] = useState<KeyTopic[]>([]);
    const [topicLoading, setTopicLoading] = useState(false);
    const [topicError, setTopicError] = useState<string | null>(null);

    // Clear topics when switching videos
    useEffect(() => {
        setKeyTopics([]);
        setTopicError(null);
    }, [videoId]);

    const generateKeyTopics = async () => {
        if (notes.length === 0) return;

        try {
            setTopicLoading(true);
            setTopicError(null);
            const response = await fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: notes.map((note) => ({
                        content: note.content,
                        timestamp_seconds: note.timestamp_seconds,
                    })),
                }),
            });

            if (!response.ok) throw new Error('Topic service request failed');
            const data = await response.json() as { topics: KeyTopic[] };
            setKeyTopics(data.topics);
        } catch (err) {
            console.error('Error generating key topics:', err);
            setTopicError('Could not generate topics. Try again.');
            setKeyTopics([]);
        } finally {
            setTopicLoading(false);
        }
    };

    return (
        <div className="key-topics-panel">
            <div className="key-topics-heading">
                <div>
                    <h2>Key topics</h2>
                    <p>Generated from all notes for this video.</p>
                </div>
                <button
                    className="key-topics-button"
                    onClick={generateKeyTopics}
                    disabled={topicLoading || notes.length === 0}
                >
                    {topicLoading ? 'Finding topics...' : 'Generate topics'}
                </button>
            </div>
            {topicError && <p className="key-topics-error">{topicError}</p>}
            {keyTopics.length > 0 && (
                <div className="key-topics-list" aria-label="Generated key topics">
                    {keyTopics.map((topic) => (
                        <span
                            key={topic.term}
                            className="key-topic-chip"
                            title={`Mentioned in ${topic.note_count} note${topic.note_count === 1 ? '' : 's'}`}
                        >
                            {topic.term}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}