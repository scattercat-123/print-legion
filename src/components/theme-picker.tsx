"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemePicker() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative w-auto px-4">
          {theme === 'light' && (
            <>
              <Sun className="h-[1.2rem] w-[1.2rem] mr-2" />
              <span>Light</span>
            </>
          )}
          {theme === 'dark' && (
            <>
              <Moon className="h-[1.2rem] w-[1.2rem] mr-2" />
              <span>Dark</span>
            </>
          )}
          {theme === 'system' && (
            <>
              <Monitor className="h-[1.2rem] w-[1.2rem] mr-2" />
              <span>System</span>
            </>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 