'use client';

import React from 'react';
import Link from 'next/link';
import ChristmasBackground from '@/components/shared/ChristmasBackground';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      <ChristmasBackground />
      
      {/* Decorative center element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-light/5 rounded-full blur-3xl -z-1" />

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header section with high-end typography */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
          <h1 className="text-6xl md:text-8xl font-display font-bold text-gradient-gold tracking-tight leading-tight">
            FAMILY BINGO
          </h1>
          <p className="text-xl md:text-2xl text-ivory/80 font-light tracking-widest uppercase">
            Transform Your Gatherings Into Memories
          </p>
          <div className="flex items-center justify-center gap-4 py-6">
            <span className="h-px w-12 bg-gold-light/40" />
            <span className="text-gold-light">✨</span>
            <span className="h-px w-12 bg-gold-light/40" />
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid md:grid-cols-2 gap-8 px-4">
          
          {/* Join Path */}
          <Link href="/play" className="group h-full">
            <div className="h-full p-8 rounded-3xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-ivory/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                  👤
                </div>
                <h2 className="text-3xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors">
                  Join a Game
                </h2>
                <p className="text-ivory/60 leading-relaxed">
                  Enter a room to play with your friends and family. Score BINGOs and celebrate together!
                </p>
              </div>
              <div className="mt-8 relative z-10">
                <span className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gold-light group-hover:gap-2 transition-all">
                  Participate <span className="text-xl">→</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Host Path */}
          <div className="space-y-4">
            <Link href="/manager" className="group block">
              <div className="p-6 rounded-2xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-1 flex items-center gap-4 group overflow-hidden relative">
                <div className="w-12 h-12 rounded-xl bg-gold-light/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                  ☁️
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors flex items-center gap-2">
                    Server Mode <span className="text-[10px] bg-gold/20 text-gold-light px-2 py-0.5 rounded-full font-sans uppercase tracking-tighter">Self-Hosted Only</span>
                  </h2>
                  <p className="text-ivory/60 text-sm">Requires Node.js + SQLite backend</p>
                </div>
              </div>
            </Link>

            <Link href="/manager?mode=p2p" className="group block">
              <div className="p-6 rounded-2xl bg-cocoa-light/30 backdrop-blur-xl border border-ivory/10 hover:border-gold-light/40 transition-all duration-500 hover:-translate-y-1 flex items-center gap-4 group overflow-hidden relative">
                <div className="w-12 h-12 rounded-xl bg-ivory/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                  ⚡
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-ivory group-hover:text-gold-light transition-colors flex items-center gap-2">
                    Serverless Mode <span className="text-[10px] bg-forest-light/20 text-forest-light px-2 py-0.5 rounded-full font-sans uppercase tracking-tighter">Cloud Ready</span>
                  </h2>
                  <p className="text-ivory/60 text-sm">No backend required, runs in browser</p>
                </div>
              </div>
            </Link>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <p className="text-ivory/40 text-sm italic tracking-wide">
            "The magic of Christmas is even better when shared."
          </p>
        </div>
      </div>
    </div>
  );
}
