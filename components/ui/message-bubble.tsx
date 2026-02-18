import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div
            className={cn(
                'flex w-full gap-4 p-4 transition-all',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                    <Bot className="h-5 w-5" />
                </div>
            )}

            <div
                className={cn(
                    'relative max-w-[80%] rounded-2xl px-5 py-3 shadow-sm',
                    isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50 backdrop-blur-sm'
                )}
            >
                <div className="prose prose-invert prose-sm">
                    {/* Simple rendering for now, can be upgraded to ReactMarkdown later if needed */}
                    <p className="whitespace-pre-wrap">{content}</p>
                </div>
            </div>

            {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    );
}
