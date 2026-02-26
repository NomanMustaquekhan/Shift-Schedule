import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, ShieldCheck, CalendarRange } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [empNo, setEmpNo] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ empNo, password });
      toast({
        title: "Welcome back",
        description: "Successfully logged in to your account.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-secondary/30">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 relative overflow-hidden bg-primary/5">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/50 blur-[100px]" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
              <CalendarRange className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground">ShiftMaster</h1>
          </div>
          
          <h2 className="text-5xl font-display font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Intelligent shift scheduling for modern teams.
          </h2>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Automate your workforce planning, manage leave requests effortlessly, and ensure optimal coverage across all shifts with our advanced scheduling algorithm.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <p className="font-medium text-foreground">Predictable month-wise planning</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="font-medium text-foreground">Ethical switching & compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-border/50 shadow-2xl shadow-black/5 rounded-3xl overflow-hidden glass-panel">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="space-y-3 pb-8 pt-10 px-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 lg:hidden">
              <CalendarRange className="w-6 h-6" />
            </div>
            <CardTitle className="text-3xl font-display font-bold">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your employee ID and password to access your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="empNo" className="text-sm font-semibold">Employee ID</Label>
                <Input
                  id="empNo"
                  placeholder="e.g. EMP001"
                  value={empNo}
                  onChange={(e) => setEmpNo(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-background border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-background border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Authenticating..." : "Sign in to account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
