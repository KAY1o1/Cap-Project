"""HTTP API web client."""

from __future__ import annotations

import os

# https://fastapi.tiangolo.com/tutorial/cors/
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# from topic_generator import extract_topics
from api.topic_generator import extract_topics

# cap 150 chars
class NoteInput(BaseModel):
    content: str = Field(min_length=1, max_length=150)
    timestamp_seconds: int | None = Field(default=None, ge=0)

# 500 notes
class TopicRequest(BaseModel):
    notes: list[NoteInput] = Field(min_length=1, max_length=500)


class Topic(BaseModel):
    term: str
    mention_count: int
    note_count: int
    timestamps: list[int]


class TopicResponse(BaseModel):
    topics: list[Topic]


allowed_origins = [
    origin.strip()
    for origin in os.getenv("TOPIC_API_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="YouNote Topic API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/topics/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/topics", response_model=TopicResponse)
def topics(request: TopicRequest) -> TopicResponse:
    note_dicts = [note.model_dump() for note in request.notes]
    return TopicResponse(topics=extract_topics(note_dicts))
