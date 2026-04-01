"use client";

import { AdUnit } from "./AdUnit";

interface SidebarAdLeftProps {
  slot: string;
  className?: string;
}

export function SidebarAdLeft({ slot, className }: SidebarAdLeftProps) {
  return (
    <div className={`hidden lg:block ${className ?? ""}`}>
      <div className="sticky top-20 w-[160px]">
        <AdUnit slot={slot} format="vertical" responsive={false} />
      </div>
    </div>
  );
}
