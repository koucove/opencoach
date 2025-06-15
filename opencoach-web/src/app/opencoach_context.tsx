'use client';

import { useState, createContext } from "react";
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { Children, useEffect, useRef } from "react";

export enum MessageType {
    Text = 'text',
    Memory = 'memory'
}

export interface Message {
    type: MessageType;
    data: string;
}

export const OpenCoachContext = createContext({
    sendMessage: (message: string) => {},
    lastJsonMessage: null,
    messageHistory: [] as Message[],
    connectionStatus: 'Closed' as string,
});

export const OpenCoachProvider = ({ children }: any) => {

    const socketUrl = 'ws://localhost:8765'

    const { sendMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
        shouldReconnect: (closeEvent) => true,
        reconnectAttempts: 10,
        //attemptNumber will be 0 the first time it attempts to reconnect, so this equation results in a reconnect pattern of 1 second, 2 seconds, 4 seconds, 8 seconds, and then caps at 10 seconds until the maximum number of attempts is reached
        reconnectInterval: (lastAttemptNumber: number) => Math.min(Math.pow(2, lastAttemptNumber) * 1000, 10000),
    });

    const [messageHistory, setMessageHistory] =
        useState<Message[]>([]);


    useEffect(() => {
        if (lastJsonMessage !== null) {
            setMessageHistory((prev) => prev.concat(lastJsonMessage));
        }
    }, [lastJsonMessage]);


    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const ret = {sendMessage, lastJsonMessage, messageHistory, connectionStatus};

    return (
        <OpenCoachContext.Provider value={ret}>
            {children}
        </OpenCoachContext.Provider>
    );
}