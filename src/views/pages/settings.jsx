import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, Mail, Moon, Shield, Sun, User, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useGetMe, getGetMeQueryKey, useGetUpcomingTasks, getGetUpcomingTasksQueryKey } from "@/api";
import { getAvatarSrc, getGeneratedAvatarSrc } from "@/lib/avatar";
const NOTIFICATION_PREFS_KEY = "skillora-notification-preferences";
const defaultNotificationPrefs = {
    dailyReminders: true,
    deadlineAlerts: true,
    emailDrafts: false,
};
export default function SettingsPage() {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const me = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
    const tasks = useGetUpcomingTasks({ query: { queryKey: getGetUpcomingTasksQueryKey() } });
    const deadlineReminders = (tasks.data ?? []).filter(task => task.type === "deadline");
    const [notificationPrefs, setNotificationPrefs] = useState(() => {
        try {
            return { ...defaultNotificationPrefs, ...JSON.parse(localStorage.getItem(NOTIFICATION_PREFS_KEY) ?? "{}") };
        }
        catch {
            return defaultNotificationPrefs;
        }
    });
    const updateNotificationPref = (key, value) => {
        const next = { ...notificationPrefs, [key]: value };
        setNotificationPrefs(next);
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
    };
    const openReminderEmail = (reminder) => {
        const subject = encodeURIComponent(`SkillOra reminder: ${reminder.title}`);
        const body = encodeURIComponent(`${reminder.title}\nDue: ${reminder.dueDate}\n${reminder.message ?? ""}`);
        window.location.href = `mailto:${user?.email ?? ""}?subject=${subject}&body=${body}`;
    };
    const updateAvatarPhoto = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (event) => updateUser({ avatarUrl: event.target?.result });
        reader.readAsDataURL(file);
    };
    return (<AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences.</p>
        </motion.div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary"/> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <img
                  src={getAvatarSrc(user)}
                  alt={`${user?.name ?? "User"} avatar`}
                  onError={(event) => {
                    event.currentTarget.src = getGeneratedAvatarSrc(user);
                  }}
                  className="h-16 w-16 rounded-full border border-border object-cover shadow-sm"
                />
                <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm hover:bg-muted">
                  <Camera className="h-4 w-4"/>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => updateAvatarPhoto(event.target.files?.[0])}
                    data-testid="input-avatar-photo"
                  />
                </label>
              </div>
              <div>
                <p className="font-semibold" data-testid="text-profile-name">{user?.name}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email}</p>
                {me.data && (<p className="text-xs text-muted-foreground mt-0.5">
                    Member since {new Date(me.data.createdAt).toLocaleDateString()}
                  </p>)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-lg font-bold text-primary">{me.data?.totalJobs ?? 0}</p>
                <p className="text-xs text-muted-foreground">Jobs</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-lg font-bold text-primary">{me.data?.streak ?? 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-lg font-bold text-primary">{Math.round((me.data?.completionRate ?? 0) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4 text-primary"/> : <Sun className="w-4 h-4 text-primary"/>}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} data-testid="switch-dark-mode"/>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary"/> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
            { key: "dailyReminders", label: "Daily reminders", desc: "Show practice reminders based on active roadmaps" },
            { key: "deadlineAlerts", label: "Deadline alerts", desc: "Show red alerts when a deadline is 7 days away" },
            { key: "emailDrafts", label: "Email reminder drafts", desc: "Prepare reminder emails from deadline alerts" },
        ].map(n => (<div key={n.label} className="flex items-center justify-between gap-4 py-1">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={notificationPrefs[n.key]} onCheckedChange={(checked) => updateNotificationPref(n.key, checked)} data-testid={`switch-${n.label.toLowerCase().replace(/\s+/g, "-")}`}/>
              </div>))}
            {notificationPrefs.deadlineAlerts && deadlineReminders.length > 0 && (<div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-200">
                <AlertTriangle className="h-4 w-4"/> Active deadline reminders
              </div>
              {deadlineReminders.map(reminder => (<div key={reminder.id} className="flex items-center justify-between gap-3 rounded-md bg-background/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-red-700 dark:text-red-200">{reminder.title}</p>
                  <p className="text-xs text-red-700/80 dark:text-red-200/80">{reminder.message} - Due {reminder.dueDate}</p>
                </div>
                {notificationPrefs.emailDrafts && (<Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => openReminderEmail(reminder)}>
                  <Mail className="h-4 w-4"/> Email
                </Button>)}
              </div>))}
            </div>)}
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary"/> Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={logout} className="w-full" data-testid="button-sign-out">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>);
}
