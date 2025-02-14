"use client";

import { ArrowUpToLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsClientPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ArrowUpToLine className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-2xl font-semibold">Print Stats</h1>
          <p className="text-sm text-muted-foreground">
            Track your printing metrics and performance
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ArrowUpToLine className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Stats Coming Soon</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            We&apos;re working on bringing you detailed statistics about your prints, 
            including filament usage, print times, and success rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 