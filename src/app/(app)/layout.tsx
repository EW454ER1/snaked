
"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect } from "react"
import { useTranslation } from 'react-i18next';
import {
  Home,
  Package,
  Wallet,
  Users,
  LogOut,
  ChevronDown,
  Languages
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/icons"
import { useUser } from "@/context/user-context"
import { Skeleton } from "@/components/ui/skeleton"

const linkClasses = "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground h-8 text-sm group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname();
  const { user, stats, logout, isInitialized } = useUser()
  const { t, i18n } = useTranslation();
  const langDir = i18n.dir()

  useEffect(() => {
    const dir = i18n.dir();
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language, i18n.dir]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/")
    }
  }, [user, isInitialized, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!isInitialized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Logo className="w-12 h-12 text-primary animate-pulse" />
            <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <SidebarProvider>
      <Sidebar side={langDir === 'rtl' ? 'right' : 'left'}>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="font-headline text-2xl font-bold text-primary">{t('appName')}</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/lobby" className={`${linkClasses} ${pathname.startsWith('/lobby') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}`}><Home /> <span>{t('nav.lobby')}</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/store" className={`${linkClasses} ${pathname.startsWith('/store') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}`}><Package /> <span>{t('nav.store')}</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/wallet" className={`${linkClasses} ${pathname.startsWith('/wallet') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}`}><Wallet /> <span>{t('nav.wallet')}</span></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/referrals" className={`${linkClasses} ${pathname.startsWith('/referrals') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}`}><Users /> <span>{t('nav.referrals')}</span></Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* Admin panel link removed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:justify-end">
          <SidebarTrigger className="sm:hidden" />
          <div className="flex items-center gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuRadioGroup value={i18n.language} onValueChange={changeLanguage}>
                  <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ar">العربية</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile.avatar} alt={user.profile.name} data-ai-hint="avatar user" />
                    <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.profile.name}</span>
                  <ChevronDown className="h-4 w-4 hidden sm:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.profile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <h4 className="text-xs font-semibold mb-2 px-2">{t('userMenu.gameStats')}</h4>
                   <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                          <p className="text-lg font-bold">{stats.roundsPlayed}</p>
                          <p className="text-xs text-muted-foreground">{t('userMenu.rounds')}</p>
                      </div>
                      <div>
                          <p className="text-lg font-bold">{stats.winRate}%</p>
                          <p className="text-xs text-muted-foreground">{t('userMenu.winRate')}</p>
                      </div>
                   </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /><span>{t('userMenu.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayoutContent>{children}</AppLayoutContent>
}
