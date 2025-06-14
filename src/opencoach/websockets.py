import asyncio
from websockets.asyncio.server import serve, ServerConnection
from opencoach.coach import make_coach
from langchain_core.runnables import RunnableConfig
from langgraph.graph.graph import CompiledGraph
from uuid import uuid4
import dotenv
from pydantic import BaseModel, Field
from enum import Enum


class MessageType(str, Enum):
    Text = "text"
    Memory = "memory"


class Message(BaseModel):
    type: MessageType = Field(description="Type of the message, e.g., 'text', 'memory'")
    data: str = Field(description="Content of the message")


async def echo(websocket: ServerConnection):
    coach: CompiledGraph = await make_coach()
    config = RunnableConfig(configurable={"thread_id": str(uuid4())})

    while True:
        user_input = await websocket.recv()
        print(f"User input: {user_input}")
        if user_input.lower() == "exit":
            break
        # Process user input and generate response
        async for message_chunk, metadata in coach.astream(input={"messages": [{"role": "user", "content": user_input}]},
                                                    config=config,
                                                    stream_mode="messages"):
            for chunk in message_chunk.content:
                if isinstance(chunk, dict) and (text := chunk.get("text", "")):
                    await websocket.send(Message(type=MessageType.Text, data=text).json())  # Send each chunk to the client
                if isinstance(chunk, str):
                    await websocket.send(Message(type=MessageType.Memory, data=chunk).json())

async def amain():
    dotenv.load_dotenv()
    async with serve(echo, "localhost", 8765) as server:
        await server.serve_forever()

def main_cli():
    asyncio.run(amain())