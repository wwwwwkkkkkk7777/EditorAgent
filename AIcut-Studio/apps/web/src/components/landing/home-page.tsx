"use client";

import { motion } from "motion/react";
import { ArrowRight, Scissors, Sparkles, Wand2, ArrowDown } from "lucide-react";
import Link from "next/link";
import { fonts } from "@/lib/font-config";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className={cn("flex flex-col w-full selection:bg-white/30", fonts.outfit.className)}>
      {/* --- Section 1: Hero --- */}
      <section className="relative h-[100svh] min-h-[600px] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Dynamic Background: Super Clean */}
        <div className="absolute inset-0 -z-50 h-full w-full bg-background isolate">
            {/* Subtle Grainy Noise */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
            {/* Very faint gradient for depth, almost invisible */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
        </div>

        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto w-full flex flex-col items-center justify-center z-10 -mt-32 md:-mt-20"
        >
            {/* Title - Value Proposition */}
            <h1 className={cn(
                "relative font-bold tracking-[-0.04em] text-6xl md:text-8xl lg:text-[7rem] leading-[0.95] text-foreground select-none",
                fonts.spaceGrotesk.className
            )}>
                Powerful AI-driven
                <br />
                <span className="text-muted-foreground/40">video editor</span>
            </h1>

            {/* Subtitle */}
            <motion.p
              className={cn(
                  "mt-8 text-lg md:text-xl text-muted-foreground/60 font-normal tracking-wide max-w-xl mx-auto leading-relaxed",
                  fonts.outfit.className
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Designed for creators.
              <br className="hidden md:block"/>
              Simply import, speak your vision, and AI handles the rest.
            </motion.p>
            
            {/* CTA Arrow */}
            <motion.button 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.8, duration: 0.8 }}
               onClick={() => document.getElementById("start-creating")?.scrollIntoView({ behavior: "smooth" })}
               className="mt-16 group cursor-pointer bg-transparent border-none p-0 outline-none"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent transition-all duration-300 group-hover:scale-110 group-hover:border-neutral-400 dark:group-hover:border-neutral-600">
                         <div className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90" />
                         <ArrowDown className="relative h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
                    </div>
                </div>
            </motion.button>
        </motion.div>

        {/* --- Decorative Timeline Fragments Removed --- */}
      </section>

      {/* --- Section 2: Entry Points (Scroll to see) --- */}
      <section id="start-creating" className="relative z-10 bg-background pt-24 pb-32 px-4 flex flex-col items-center min-h-[50vh]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
             <h2 className={cn("text-3xl md:text-5xl font-bold mb-4", fonts.spaceGrotesk.className)}>Start Creating</h2>
             <p className="text-muted-foreground/80 max-w-lg mx-auto">Choose the workflow that fits you best—from manual precision to AI automation.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {/* 基础剪辑按钮 - Manual Mode */}
          <Link href="/projects" className="group/card relative w-full group">
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-full overflow-hidden rounded-3xl bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h3 className={cn("text-lg font-semibold text-neutral-900 dark:text-neutral-100", fonts.spaceGrotesk.className)}>Manual Cut</h3>
                      <p className={cn("text-xs text-neutral-500 font-mono tracking-tight", fonts.jetBrainsMono.className)}>TIMELINE EDITOR</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="h-1.5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                       <div className="h-full w-0 bg-neutral-400 dark:bg-neutral-500 group-hover:w-full transition-all duration-700 ease-in-out" />
                    </div>
                    <div className="h-1.5 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                       <div className="h-full w-0 bg-neutral-400 dark:bg-neutral-500 group-hover:w-2/3 transition-all duration-1000 ease-in-out delay-75" />
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                    Traditional NLE Workflow
                    <br />
                    <span className="text-neutral-400 font-normal">Precise control over every frame</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* 智能剪辑按钮 - Agent Mode */}
          <Link href="/smart-edit" className="group/card relative w-full group">
             <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-full overflow-hidden rounded-3xl bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700"
            >
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                        <h3 className={cn("text-lg font-semibold text-neutral-900 dark:text-neutral-100", fonts.spaceGrotesk.className)}>Agent Cut</h3>
                        <p className={cn("text-xs text-neutral-500 font-mono tracking-tight", fonts.jetBrainsMono.className)}>AI DIRECTOR</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
                </div>
                
                <div className="mt-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-fit">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Auto-Pilot Active</span>
                    </div>

                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                    Fully Automated Mode
                    <br/>
                    <span className="text-neutral-400 font-normal">Agent-driven generative editing</span>
                    </p>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
