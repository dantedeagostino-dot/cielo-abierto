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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800/80 border border-slate-600/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] backdrop-blur-md">
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
                            'relative px-5 py-3 transition-all duration-300',
                            isUser
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_10px_rgba(59,130,246,0.3)]'
                                : 'bg-slate-900/60 text-slate-100 rounded-2xl rounded-bl-sm border border-slate-600/30 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.4)]'
                        )}
                    >
                        <div className="prose prose-invert prose-sm">
                            {/* Only render content if it exists, otherwise show a fallback if no tools either */}
                            {content ? (
                                <ReactMarkdown
                                    components={{
                                        // Override link rendering to show images inline if they are image URLs
                                        a: ({ node, ...props }) => {
                                            const isImage = props.href?.match(/\.(jpeg|jpg|gif|png)$/i);
                                            if (isImage) {
                                                return (
                                                    <span className="block my-2 rounded-lg overflow-hidden border border-white/10">
                                                        <img
                                                            src={props.href}
                                                            alt={String(props.children) || 'Image'}
                                                            className="w-full h-auto max-h-64 object-cover"
                                                            loading="lazy"
                                                        />
                                                    </span>
                                                );
                                            }
                                            return (
                                                <a
                                                    {...props}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-300 hover:text-blue-200 underline"
                                                />
                                            );
                                        },
                                        // Style other elements
                                        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2 space-y-1" />,
                                        ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2 space-y-1" />,
                                        li: ({ node, ...props }) => <li {...props} className="pl-1" />,
                                        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-blue-200" />,
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            ) : (
                                !hasTools && <p className="italic text-white/40">...</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 text-slate-300 shadow-md">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    );
}
