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
            className="relative flex w-full items-center gap-2 rounded-2xl bg-slate-900/60 p-2 backdrop-blur-xl border border-slate-600/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:bg-slate-900/80 focus-within:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(59,130,246,0.2)]"
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
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed group"
            >
                <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
        </form>
    );
}
