'use client'

import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useState, useCallback, useEffect } from 'react';

enum MessageType {
    Text = 'text',
    Memory = 'memory'
}

interface Message {
    type: MessageType;
    data: string;
}

export const OpenCoachConversation = () => {
    const socketUrl = 'ws://localhost:8765'

    const [messageHistory, setMessageHistory] =
        useState<Message[]>([]);

    const { sendMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
        shouldReconnect: (closeEvent) => true,
        reconnectAttempts: 10,
        //attemptNumber will be 0 the first time it attempts to reconnect, so this equation results in a reconnect pattern of 1 second, 2 seconds, 4 seconds, 8 seconds, and then caps at 10 seconds until the maximum number of attempts is reached
        reconnectInterval: (lastAttemptNumber: number) => Math.min(Math.pow(2, lastAttemptNumber) * 1000, 10000),
    });

    useEffect(() => {
        if (lastJsonMessage !== null) {
            setMessageHistory((prev) => prev.concat(lastJsonMessage));
        }
    }, [lastJsonMessage]);

    function handleSubmit(e: any) {
        // Prevent the browser from reloading the page
        e.preventDefault();

        // Read the form data
        const form = e.target;
        const formData = new FormData(form);

        const humanInput = formData.get('humanInput') as string;
        // Send the message if humanInput is not empty
        if (humanInput) {
            sendMessage(humanInput);
            form.reset(); // Clear the input field after sending
            return false; // Prevent default form submission behavior
        }
    }

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    return (
        <div>
            <span>The WebSocket is currently {connectionStatus}</span>
            <h3>Coach memory</h3>
            <div>
                {messageHistory.map((message, idx) => (
                    <span key={idx}>{message.type === MessageType.Memory ? message.data : ""}</span>
                ))}
            </div>
            <h3>Conversation</h3>
            <div>
                {messageHistory.map((message, idx) => (
                    <span key={idx}>{message.type === MessageType.Text ? message.data : ""}</span>
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <label>
                    Text input: <input name="humanInput" />
                </label>
                <button
                    type="submit"
                >
                    Send
                </button>
            </form>
        </div>
    );
};