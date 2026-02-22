'use client';

import { useChat } from '@ai-sdk/react';
import ChatInput from '@/components/ui/chat-input';
import MessageBubble from '@/components/ui/message-bubble';
import SpaceBackground from '@/components/ui/space-background';
import { useRef, useEffect, useState } from 'react';
import SplashScreen from '@/components/ui/splash-screen';
import { AnimatePresence, motion } from 'framer-motion';
import { type UIMessage } from 'ai';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const chatConfig = useChat({
    onError: (error) => console.error('[Frontend] useChat error:', error),
    onFinish: (message) => console.log('[Frontend] useChat finished:', message),
  });
  const { messages, status } = chatConfig;
  const [input, setInput] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim()) return;

    try {
      if (chatConfig.sendMessage) {
        await chatConfig.sendMessage({ text: input });
      } else {
        console.error('CRITICAL: No sendMessage method found on useChat return object!');
      }
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Log for debugging
  console.log('useChat keys:', Object.keys(chatConfig));
  console.log('useChat values (v5 fix):', { input, status, isLoading, messagesLength: messages?.length });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <main className="flex h-[100dvh] flex-col items-center justify-between p-4 md:p-24 relative overflow-hidden">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <SpaceBackground />

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-4 shrink-0">
        <p className="fixed left-0 top-0 flex w-full justify-center pb-6 pt-8 backdrop-blur-md lg:static lg:w-auto lg:rounded-xl lg:p-4 text-white">
          Proyecto&nbsp;
          <code className="font-bold">Cielo Abierto</code>
        </p>

      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col gap-4 overflow-y-auto p-4 rounded-xl relative z-10 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/80 space-y-4">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Explora el Universo
            </h1>
            <p className="text-lg max-w-md">
              Soy tu copiloto en esta misión. Puedo acceder a imágenes de la Tierra (EPIC), clima de Marte (InSight), exoplanetas, patentes de la NASA y mucho más.
            </p>
          </div>
        )}

        {messages?.map((m: any) => (
          <MessageBubble
            key={m.id}
            role={m.role === 'user' ? 'user' : 'assistant'}
            content={m.content || (m.parts ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') : '') || ''}
            toolInvocations={m.toolInvocations || (m.parts ? m.parts.filter((p: any) => p.type === 'tool-invocation').map((p: any) => p.toolInvocation) : undefined)}
          />
        ))}

        {isLoading && (
          <div className="self-start ml-12 text-blue-400 animate-pulse">
            Conectando con satélites...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full max-w-4xl z-20 mt-4 shrink-0 flex flex-col gap-2">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="Pregúntale al cosmos..."
        />
        <footer className="w-full text-center text-[10px] md:text-xs text-white/40 font-mono">
          Powered by Nasa and <span className="font-bold text-blue-400">ColossusLab.tech</span>
          <span className="opacity-20 ml-2">
            Tools: {(messages[messages.length - 1] as any)?.toolInvocations?.length || (messages[messages.length - 1]?.parts ? messages[messages.length - 1].parts.filter((p: any) => p.type === 'tool-invocation').length : 0) || 0}
          </span>
        </footer>
      </div>
    </main >
  );
}
