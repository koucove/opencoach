'use client'

import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { OpenCoachContext } from './opencoach_context';

enum MessageType {
    Text = 'text',
    Memory = 'memory'
}

interface Message {
    type: MessageType;
    data: string;
}

export const OpenCoachConversation = () => {
    const { sendMessage, lastJsonMessage, messageHistory, connectionStatus } = useContext(OpenCoachContext)

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

    return (
        <section>
            <span>The WebSocket is currently {connectionStatus}</span>
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
        </section>
    );
};