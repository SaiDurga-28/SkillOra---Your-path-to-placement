import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Home, LayoutDashboard, Upload, Briefcase, Mic, BookOpen, Settings, LogOut, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getGetUpcomingTasksQueryKey, useGetUpcomingTasks } from "@/api";
import { SkillOraLogo } from "@/components/brand/skillora-logo";
import { getAvatarSrc, getGeneratedAvatarSrc } from "@/lib/avatar";
const navItems = [
    { href: "/", icon: Home, label: "Home", exact: true },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/upload", icon: Upload, label: "Upload JD" },
    { href: "/jobs", icon: Briefcase, label: "My Jobs" },
    { href: "/interviews", icon: Mic, label: "Mock Interviews" },
    { href: "/crt", icon: BookOpen, label: "Assessments" },
    { href: "/settings", icon: Settings, label: "Settings" },
];
export function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [location] = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    useGetUpcomingTasks({ query: { queryKey: getGetUpcomingTasksQueryKey() } });
    return (<div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col", "transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        <div className="px-6 py-5 border-b border-sidebar-border">
          <SkillOraLogo className="text-sidebar-foreground" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.exact ? location === item.href : location.startsWith(item.href);
            return (<Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <div data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer", active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className="w-4 h-4 shrink-0"/>
                  {item.label}
                </div>
              </Link>);
        })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <img
              src={getAvatarSrc(user)}
              alt={`${user?.name ?? "User"} avatar`}
              onError={(event) => {
                event.currentTarget.src = getGeneratedAvatarSrc(user);
              }}
              className="h-10 w-10 shrink-0 rounded-full border border-sidebar-border object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} data-testid="button-toggle-theme" className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent">
              {theme === "dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout" className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="w-4 h-4"/>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {mobileOpen && (<div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}/>)}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <SkillOraLogo compact />
            <span className="font-bold text-sm">SkillOra</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5"/>
          </Button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <motion.div key={location} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
            {children}
          </motion.div>
        </main>
      </div>
    </div>);
}
