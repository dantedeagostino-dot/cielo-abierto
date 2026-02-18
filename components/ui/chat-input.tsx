'use client';

import { Send } from 'lucide-react';
import React, { useState } from 'react';

interface ChatInputProps {
    // Optional controlled props
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Optional submit handler (for both modes)
    onSend?: (message: string) => void;
    // Optional form submit handler (compatible with useChat)
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;

    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({ value, onChange, onSend, onSubmit, disabled, placeholder }: ChatInputProps) {
    const [internalValue, setInternalValue] = useState('');

    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
        if (!isControlled) {
            setInternalValue(e.target.value);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (onSubmit) {
            onSubmit(e);
            return;
        }

        if (onSend && inputValue.trim() && !disabled) {
            onSend(inputValue);
            if (!isControlled) {
                setInternalValue('');
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex w-full items-center gap-2 rounded-xl bg-slate-800/50 p-2 backdrop-blur-md border border-slate-700 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-blue-500/50"
        >
            <input
                type="text"
                name="prompt"
                value={inputValue}
                onChange={handleChange}
                placeholder={placeholder || "Pregúntale al cosmos..."}
                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-400 focus:outline-none"
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={disabled || !inputValue.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="h-5 w-5" />
            </button>
        </form>
    );
}
