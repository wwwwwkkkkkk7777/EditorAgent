"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { RiDiscordFill, RiTwitterXLine } from "react-icons/ri";
import { FaGithub } from "react-icons/fa6";
import Image from "next/image";

export function Footer() {
  return (
    <motion.footer
      className="bg-background border-t"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.8 }}
    >
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex justify-center md:justify-start items-center gap-2 mb-3">
              <Image 
                src="/logo.svg" 
                alt="Ascendflow AI Cut" 
                width={24} 
                height={24}
                className="invert dark:invert-0 opacity-80"
              />
              <span className="font-bold text-lg tracking-tight">Ascendflow AI Cut</span>
            </div>
            <p className="text-sm text-muted-foreground/80 text-center md:text-left max-w-md">
              Intelligent video editing tool by Ascendflow AI
              <span className="hidden md:inline mx-2">·</span>
              <span className="block md:inline mt-1 md:mt-0">Empowering creators with efficiency and creative freedom</span>
            </p>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center md:items-end gap-2">
              <div className="text-sm text-muted-foreground/60 font-mono">
                © 2025 Ascendflow AI
              </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
