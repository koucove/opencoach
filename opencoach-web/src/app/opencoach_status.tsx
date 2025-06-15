'use client';

import React, { useContext } from 'react';
import { OpenCoachContext, MessageType } from './opencoach_context';

export const OpenCoachStatus = () => {
    const { messageHistory, connectionStatus } = useContext(OpenCoachContext);

    return (
        <div>
            <h3>Connection Status</h3>
            <span>{connectionStatus}</span>
            <h3>Memory</h3>
            <p>
                {messageHistory.map((message, idx) => (
                    <span key={idx}>{message.type === MessageType.Memory ? message.data : ""}</span>
                ))}
            </p>
        </div>
    );
}