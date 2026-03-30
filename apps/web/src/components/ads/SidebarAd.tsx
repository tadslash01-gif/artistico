"use client";

import { AdUnit } from "./AdUnit";

interface SidebarAdProps {
  slot: string;
  className?: string;
}

export function SidebarAd({ slot, className }: SidebarAdProps) {
  return (
    <div className={`hidden lg:block ${className ?? ""}`}>
      <div className="sticky top-20 w-[300px]">
        <AdUnit slot={slot} format="rectangle" responsive={false} />
      </div>
    </div>
  );
}
