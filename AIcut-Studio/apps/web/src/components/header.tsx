"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "./header-base";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="AIcut Logo"
        width={32}
        height={32}
      />
      <span className="text-xl font-medium hidden md:block">Ascendflow AI Cut</span>
    </Link>
  );

  const rightContent = null;

  return (
    <div className="sticky top-6 z-50 px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <HeaderBase
          className="bg-background/70 backdrop-blur-xl border border-border/40 rounded-full max-w-4xl mx-auto h-16 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-background/40"
          leftContent={leftContent}
          rightContent={rightContent}
        />
      </div>
    </div>
  );
}
