"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Camera, Users, Settings, Menu, LogOut, Home, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  userType: "user" | "admin"
  onLogout?: () => void
}

export function Header({ userType, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const userNavItems = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/register-face", label: "顔写真登録", icon: Users },
  ]

  const adminNavItems = [
    { href: "/admin", label: "管理画面", icon: Settings },
    { href: "/admin/upload", label: "写真アップロード", icon: Upload },
  ]

  const navItems = userType === "admin" ? adminNavItems : userNavItems

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">写真管理システム</span>
          </Link>
          <Badge variant={userType === "admin" ? "destructive" : "secondary"}>
            {userType === "admin" ? "管理者" : "一般ユーザー"}
          </Badge>
        </div>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          {onLogout && (
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          )}
        </nav>

        {/* モバイルナビゲーション */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 text-sm font-medium p-3 rounded-lg transition-colors hover:bg-accent",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              {onLogout && (
                <Button
                  variant="outline"
                  className="justify-start gap-3 mt-4"
                  onClick={() => {
                    onLogout()
                    setIsOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
