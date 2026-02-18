'use client';

import { useChat } from 'ai/react';
import type { Message } from 'ai/react'; // Trying implicit export or just relying on useChat's return type inferred
import ChatInput from '@/components/ui/chat-input';
import MessageBubble from '@/components/ui/message-bubble';
import SpaceBackground from '@/components/ui/space-background';
import { useRef, useEffect } from 'react';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 relative overflow-hidden">
      <SpaceBackground />

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Proyecto&nbsp;
          <code className="font-bold">Cielo Abierto</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0 text-white"
            href="https://nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by NASA Open APIs
          </a>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col gap-4 overflow-y-auto max-h-[70vh] p-4 rounded-xl ">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/80 space-y-4">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Explora el Universo
            </h1>
            <p className="text-lg max-w-md">
              Soy tu copiloto en esta misión. Pregúntame sobre la foto astronómica del día, asteroides cercanos o fotos de Marte.
            </p>
          </div>
        )}

        {messages.map((m: any) => (
          <MessageBubble key={m.id} role={m.role === 'user' ? 'user' : 'assistant'} content={m.content} />
        ))}

        {isLoading && (
          <div className="self-start ml-12 text-blue-400 animate-pulse">
            Conectando con satélites...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full max-w-4xl z-20 mt-4">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="Pregúntale al cosmos..."
        />
      </div>
    </main>
  );
}
