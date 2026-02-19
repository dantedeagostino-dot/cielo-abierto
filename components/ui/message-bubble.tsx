import { cn } from '@/lib/utils';
import { User, Bot, Loader2, FileCode2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ToolResult from './tool-result';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    toolInvocations?: any[];
}

export default function MessageBubble({ role, content, toolInvocations }: MessageBubbleProps) {
    const isUser = role === 'user';
    const hasTools = toolInvocations && toolInvocations.length > 0;

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

            <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
                {/* Tool Invocations Area */}
                {hasTools && (
                    <div className="flex flex-col gap-2 w-full">
                        {toolInvocations?.map((tool: any) => (
                            <div key={tool.toolCallId} className="flex flex-col gap-1 w-full">
                                <div className="flex items-center gap-2 text-xs text-blue-300/70 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-500/20 w-fit">
                                    {tool.state === 'result' ? (
                                        <FileCode2 className="h-3 w-3" />
                                    ) : (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    <span className="font-mono">{tool.toolName}</span>
                                    <span className="opacity-50">
                                        {tool.state === 'result' ? 'completado' : 'procesando...'}
                                    </span>
                                </div>

                                {tool.state === 'result' && (
                                    <ToolResult toolName={tool.toolName} result={tool.result} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {(content || (!hasTools && !content)) && (
                    <div
                        className={cn(
                            'relative px-5 py-3 shadow-sm',
                            isUser
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                                : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-bl-none border border-slate-700/50 backdrop-blur-sm'
                        )}
                    >
                        <div className="prose prose-invert prose-sm">
                            {/* Only render content if it exists, otherwise show a fallback if no tools either */}
                            {content ? (
                                <p className="whitespace-pre-wrap">{content}</p>
                            ) : (
                                !hasTools && <p className="italic text-white/40">...</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    );
}
