from langgraph.prebuilt import create_react_agent
from langsmith import wrappers
import datetime
import dotenv
import langsmith
import json
from openevals.llm import create_llm_as_judge
from enum import Enum
from langgraph.prebuilt.chat_agent_executor import AgentState
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.runnables import RunnableConfig
from typing import Annotated
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage
from langmem.short_term import SummarizationNode
from langchain_core.messages.utils import count_tokens_approximately
from typing import Any
from langchain_anthropic import ChatAnthropic
from langsmith import traceable
from langsmith.wrappers import wrap_anthropic
import anthropic
from langchain_anthropic import ChatAnthropic

def get_time() -> datetime.datetime:
    """Get the current time."""
    return datetime.datetime.now()


class GrowPhase(str, Enum):
    Goal = "goal"
    Reality = "reality"
    Options = "options"
    Will = "will"


class State(AgentState):
    session_topic: str
    grow_phase: GrowPhase
    start_time: datetime.datetime
    context: dict[str, Any]


async def amain():
    dotenv.load_dotenv()

    llm = ChatAnthropic(
        model_name="claude-4-sonnet-20250514",
        temperature=0,
        max_tokens=1024,
        timeout=None,
        max_retries=2,
        # api_key="...",
        # base_url="...",
        # other params...
    )

    checkpointer = InMemorySaver()

    coach_agent_instructions = """\
    You are a coach using the GROW model. Your task is to generate coaching questions to help the client explore
    their goals, reality, options, and will.
    You will interact with the client in a structured way, guiding them through the GROW coaching session phases.
    The GROW model consists of four phases:
    1. Goal: The client has to define the goal of the coaching session.
       The Goal phase purpose is make to understand what the client wants to achieve. The goal should be SMART, ie:
        * specific
        * measurable
        * achievable
        * relevant
        * time-bound
    2. Reality: Explore the current reality of the client.
    3. Options: Discuss the options available to the client to achieve their goal.
    4. Will: Help the client commit to action steps to achieve their goal.

    You will receive messages from the client and respond accordingly, guiding them through the GROW phases.
    Coaching sessions are typically 30 minutes long, so you should keep track of the time and ensure that the session stays within this limit.
    You are allowed to use the `get_time` tool to check the current time during the session.

    You will not provide direct answers to factual questions, but instead guide the client to find the answer themselves.
    You will also not provide advice, but instead ask questions to help the client explore their own thoughts and feelings.
    You will start the session by asking the client to define their goal for the session.

    Please think about the next question to ask. You are allowed to use only one question at a time.
    If the client asks a question that is not related to the GROW model, you will politely redirect them back to the session topic.
    """

    

    summarization_node = SummarizationNode(
        token_counter=count_tokens_approximately,
        model=llm,
        max_tokens=384,
        max_summary_tokens=128,
        output_messages_key="llm_input_messages",
    )

    coach_agent = create_react_agent(
        model=llm,
        tools=[get_time],
        prompt=coach_agent_instructions,
        state_schema=State,
        checkpointer=checkpointer,
        pre_model_hook=summarization_node,
    )

    # Run the agent
    config = RunnableConfig(configurable={"thread_id": "1"})


    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        # Process user input and generate response
        async for message_chunk, _ in coach_agent.astream(input={"messages": [{"role": "user", "content": user_input}]},
                                                          config=config,
                                                          stream_mode="messages"):
            for chunk in message_chunk.content:
                if isinstance(chunk, str):
                    print(chunk, end="", flush=True)
                else:
                    print(chunk.get("text") or chunk, end="", flush=True)
        print()


def main_cli():
    import asyncio

    asyncio.run(amain())