import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "./logo";

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();

  const isPublicScanPage = location.startsWith("/t/");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1">
          <Logo className="w-11 h-11" />
          <span className="font-bold text-xl tracking-tight" data-testid="text-logo">FidoLink</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          
          {!isLoading && !isPublicScanPage && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" data-testid="link-dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                                    <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" data-testid="link-login">
                      Accedi
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" data-testid="link-signup">
                      Registrati
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
