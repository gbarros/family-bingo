'use client';

import React from 'react';
import Link from 'next/link';
import ChristmasBackground from '@/components/shared/ChristmasBackground';

export default function LandingPage() {
  const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      <ChristmasBackground />
      
      {/* Decorative center element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-light/5 rounded-full blur-3xl -z-1" />

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header section with high-end typography */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
          <h1 className="text-6xl md:text-8xl font-display font-bold text-gradient-gold tracking-tight leading-tight">
            BINGO EM FAMÍLIA
          </h1>
          <p className="text-xl md:text-2xl text-ivory/80 font-light tracking-widest uppercase">
            Transforme seus encontros em memórias
          </p>
          <div className="flex items-center justify-center gap-4 py-6">
            <span className="h-px w-12 bg-gold-light/40" />
            <span className="text-gold-light">✨</span>
            <span className="h-px w-12 bg-gold-light/40" />
            <div className="absolute top-0 right-0 p-4">
               <span className="text-xs font-mono text-ivory/20 uppercase tracking-widest">
                 Modo: {process.env.NEXT_PUBLIC_GAME_MODE || 'server'}
               </span>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className={`grid ${!isP2P ? 'md:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'} gap-8 px-4`}>
          
          {/* Join Path - Only visible in Server mode */}
          {!isP2P && (
          <Link href="/play" className="group h-full">
            <div className="h-full p-8 rounded-3xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-ivory/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                  👤
                </div>
                <h2 className="text-3xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors">
                  Entrar no Jogo
                </h2>
                <p className="text-ivory/60 leading-relaxed">
                  Entre em uma sala para jogar com seus amigos e família. Faça BINGOs e comemore junto!
                </p>
              </div>
              <div className="mt-8 relative z-10">
                <span className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gold-light group-hover:gap-2 transition-all">
                  Participar <span className="text-xl">→</span>
                </span>
              </div>
            </div>
          </Link>
          )}

          {/* Host Path - Conditional */}
          {isP2P ? (
            <Link href="/manager" className="group block">
              <div className="h-full p-8 rounded-3xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-ivory/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors flex items-center gap-2">
                       Hospedar Jogo
                    </h2>
                    <p className="text-ivory/60 leading-relaxed mt-2">
                      Comece um novo jogo P2P instantaneamente. Sem necessidade de configurar servidor.
                    </p>
                  </div>
                </div>
                 <div className="mt-8 relative z-10">
                  <span className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gold-light group-hover:gap-2 transition-all">
                    Começar a Hospedar <span className="text-xl">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/manager" className="group block">
              <div className="h-full p-8 rounded-3xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gold-light/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                    ☁️
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors flex items-center gap-2">
                      Gerenciar Servidor
                    </h2>
                    <p className="text-ivory/60 leading-relaxed mt-2">
                      Acesse o painel do servidor dedicado para gerenciar jogos persistentes.
                    </p>
                  </div>
                </div>
                 <div className="mt-8 relative z-10">
                  <span className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gold-light group-hover:gap-2 transition-all">
                    Acessar Sistema <span className="text-xl">→</span>
                  </span>
                </div>
              </div>
            </Link>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <p className="text-ivory/40 text-sm italic tracking-wide">
            "A magia do Natal é ainda melhor quando compartilhada."
          </p>
        </div>
      </div>
    </div>
  );
}
