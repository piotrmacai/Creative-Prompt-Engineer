import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, SparklesIcon } from './Icons';
import { Spinner } from './Spinner';

export const ChatBot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(createChat());
        setMessages([{ role: 'model', text: 'Hello! How can I help you with your creative process today?' }]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                         <div className={`max-w-md rounded-xl px-4 py-3 ${msg.role === 'user' ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-md rounded-xl px-4 py-3 bg-gray-100 text-gray-800 rounded-bl-none">
                            <Spinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="w-full bg-light-gray border border-gray-300 rounded-lg p-3 pr-12 focus:ring-brand-secondary focus:border-brand-secondary transition"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-400 hover:text-brand-primary disabled:text-gray-300 transition"
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};