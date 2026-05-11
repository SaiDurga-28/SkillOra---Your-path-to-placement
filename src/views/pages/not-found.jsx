import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillOraLogo } from "@/components/brand/skillora-logo";
export default function NotFound() {
    return (<div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6"><SkillOraLogo /></div>
      <h1 className="text-4xl font-black mb-2">404</h1>
      <p className="text-lg font-semibold mb-1">Page not found</p>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button className="gap-2" data-testid="button-go-home">
          <ArrowLeft className="w-4 h-4"/> Go Home
        </Button>
      </Link>
    </div>);
}
