import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { registerLocalUser } from "@/lib/local-auth";
import { SkillOraLogo } from "@/components/brand/skillora-logo";
const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "", password: "" },
    });
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const res = await registerLocalUser(data);
            login(res.token, res.user);
            setLocation("/dashboard");
        }
        catch (error) {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 bg-primary/5 border-r border-border flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-accent/15 rounded-full blur-3xl"/>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="relative">
          <div className="mb-10"><SkillOraLogo /></div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            <span className="text-primary">Your placement journey</span><br />starts right here.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Upload a job description and get a complete, AI-generated preparation plan within seconds.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
            ["10K+", "Students trained"],
            ["95%", "Success rate"],
            ["500+", "JDs analyzed"],
            ["50+", "Partner companies"],
        ].map(([val, label]) => (<div key={label} className="p-4 rounded-lg border border-border bg-card">
                <div className="text-xl font-bold text-primary">{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><SkillOraLogo /></div>

          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">Create account</h1>
            <Sparkles className="w-5 h-5 text-primary"/>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Free forever. No credit card required.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Arjun Sharma" data-testid="input-name"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
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
                    <Input {...field} type="password" placeholder="At least 6 characters" data-testid="input-password"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>);
}
