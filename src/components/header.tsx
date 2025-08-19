"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, UserIcon, LogOutIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className="border-b">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-sm sm:text-base">Grant Pipeline</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 sm:gap-6 text-sm font-medium">
            <Link
              href="/"
              className={pathname === '/' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'}
            >
              Dashboard
            </Link>
            <Link
              href="/domains"
              className={pathname === '/domains' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'}
            >
              Domains
            </Link>
            <Link
              href="/extractions"
              className={pathname === '/extractions' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'}
            >
              Extractions
            </Link>
            <Link
              href="#"
              className={pathname === '#' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'}
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <MenuIcon className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 pt-8 text-sm font-medium">
                  <Link
                    href="/"
                    className="text-lg font-semibold pl-4"
                  >
                    Grant Pipeline
                  </Link>
                  <div className="flex flex-col gap-4 pl-4">
                    <Link
                      href="/"
                      className={`${pathname === '/' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'} py-2`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/domains"
                      className={`${pathname === '/domains' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'} py-2`}
                    >
                      Domains
                    </Link>
                    <Link
                      href="/extractions"
                      className={`${pathname === '/extractions' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'} py-2`}
                    >
                      Extractions
                    </Link>
                    <Link
                      href="#"
                      className={`${pathname === '#' ? 'text-foreground font-medium' : 'text-foreground/60 transition-colors hover:text-foreground/80'} py-2`}
                    >
                      Settings
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs sm:text-sm"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="text-xs sm:text-sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
