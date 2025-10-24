import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserMenuProps {
  user: SupabaseUser | null;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

export const UserMenu = ({ user, onProfileClick, onSettingsClick, onSignOut }: UserMenuProps) => {
  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'profile':
        onProfileClick();
        break;
      case 'settings':
        onSettingsClick();
        break;
      case 'signout':
        onSignOut();
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-semibold hover:scale-105 transition-transform">
          {(user?.user_metadata?.full_name || "D").charAt(0).toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border rounded-xl">
        <DropdownMenuItem onClick={() => handleMenuItemClick('profile')} className="cursor-pointer rounded-lg">
          <User className="w-4 h-4 mr-2" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMenuItemClick('settings')} className="cursor-pointer rounded-lg">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleMenuItemClick('signout')} className="cursor-pointer text-destructive rounded-lg">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};