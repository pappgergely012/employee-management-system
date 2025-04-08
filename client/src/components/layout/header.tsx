import { useState } from "react";
import { Bell, Search, Settings, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
  openSidebar: () => void;
}

export default function Header({ title, openSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openSidebar} 
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </span>
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 text-sm"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-gray-500" />
          </Button>

          {/* Logout Button */}
          {user && (
            <Button
              variant="ghost"
              className="flex items-center text-gray-700 hover:text-primary"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut size={18} className="mr-2" />
              {logoutMutation.isPending ? "..." : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
