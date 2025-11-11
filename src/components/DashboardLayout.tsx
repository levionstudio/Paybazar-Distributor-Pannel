import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "master" | "distributor";
  walletBalance?: number;
}

export function DashboardLayout({ children, role, walletBalance = 50000 }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");
    
    if (!authToken || userRole !== role) {
      navigate("/login");
    }
  }, [navigate, role]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role={role} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent rounded-lg p-2 transition-colors" />
                <h1 className="text-xl font-heading font-semibold text-foreground">
                  {role === "master" ? "Master Distributor" : "Distributor"} Dashboard
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Wallet Balance */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-wallet-bg border border-wallet-border">
                  <Wallet className="w-4 h-4 text-wallet-text" />
                  <span className="text-sm font-semibold text-wallet-text">
                    ₹{walletBalance.toLocaleString()}
                  </span>
                </div>

              

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-lg hover:bg-accent">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(userEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm font-medium">{userEmail}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet: ₹{walletBalance.toLocaleString()}
                    </DropdownMenuItem>
               
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
