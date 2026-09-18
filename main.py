import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field


load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing from the .env file")

client = Groq(api_key=api_key)

app = FastAPI(title="Information Browser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "Information Browser Backend is running"}


@app.post("/ask")
def ask_ai(data: Question) -> dict[str, str]:
    question = data.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful information assistant.",
                },
                {
                    "role": "user",
                    "content": question,
                },
            ],
            temperature=0.7,
        )

        answer = response.choices[0].message.content

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response.",
            )

        return {"answer": answer}

    except HTTPException:
        raise
    except Exception as error:
        print(f"Groq API error: {error}")
        raise HTTPException(
            status_code=502,
            detail="Failed to get a response from the AI service.",
        ) from error