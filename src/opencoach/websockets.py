import asyncio
from websockets.asyncio.server import serve, ServerConnection, Request
from opencoach.coach import make_coach
from langchain_core.runnables import RunnableConfig
from langgraph.graph.graph import CompiledGraph
from uuid import uuid4
import dotenv
from pydantic import BaseModel, Field
from enum import Enum
import signal
import http


class MessageType(str, Enum):
    Text = "text"
    Memory = "memory"


class Message(BaseModel):
    type: MessageType = Field(description="Type of the message, e.g., 'text', 'memory'")
    data: str = Field(description="Content of the message")


async def session(websocket: ServerConnection):
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
                    await websocket.send(Message(type=MessageType.Text, data=text).json())
                if isinstance(chunk, str):
                    await websocket.send(Message(type=MessageType.Memory, data=chunk).json())


def health_check(connection: ServerConnection, request: Request):
    if request.path == "/healthz":
        return connection.respond(http.HTTPStatus.OK, "OK\n")



async def amain():
    dotenv.load_dotenv()
    async with serve(session, '0.0.0.0', 8765, process_request=health_check) as server:
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGTERM, server.close)
        await server.wait_closed()


def main_cli():
    asyncio.run(amain())