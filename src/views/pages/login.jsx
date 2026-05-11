import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { loginLocalUser } from "@/lib/local-auth";
import { SkillOraLogo } from "@/components/brand/skillora-logo";
const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});
export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const res = await loginLocalUser(data);
            login(res.token, res.user);
            setLocation("/dashboard");
        }
        catch (error) {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 bg-primary/5 border-r border-border flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-accent/20 rounded-full blur-3xl"/>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="relative">
          <div className="mb-10"><SkillOraLogo /></div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">Welcome back.<br />Let's continue where<br />you left off.</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Your personalized roadmap, practice sessions, and mock interviews are waiting for you.
          </p>
          <div className="mt-10 space-y-4">
            {["Personalized learning roadmap", "AI-powered skill extraction", "Mock interview feedback"].map(f => (<div key={f} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary"/>
                <span className="text-muted-foreground">{f}</span>
              </div>))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><SkillOraLogo /></div>

          <h1 className="text-2xl font-bold mb-2">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-8">Enter your credentials to access your account.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="you@example.com" data-testid="input-email"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" data-testid="input-password"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>);
}
