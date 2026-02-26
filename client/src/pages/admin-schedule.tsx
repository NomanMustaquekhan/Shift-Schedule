import { useState } from "react";
import { format, getYear, getMonth, addMonths } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAutoSchedule } from "@/hooks/use-schedules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Redirect } from "wouter";

export default function AdminSchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Default to next month for planning
  const nextMonth = addMonths(new Date(), 1);
  const [year, setYear] = useState<string>(getYear(nextMonth).toString());
  // Assuming 1-indexed months for the UI selection to match human expectations (1=Jan, 12=Dec)
  const [month, setMonth] = useState<string>((getMonth(nextMonth) + 1).toString());

  const autoSchedule = useAutoSchedule();

  // If user somehow gets here without admin rights
  if (user && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  const handleGenerate = async () => {
    try {
      await autoSchedule.mutateAsync({
        year: parseInt(year, 10),
        month: parseInt(month, 10)
      });
      
      toast({
        title: "Schedule Generated",
        description: `Successfully created shift schedule for ${month}/${year}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during scheduling.",
      });
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => (getYear(new Date()) + i).toString());
  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" },
    { value: "3", label: "March" }, { value: "4", label: "April" },
    { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" },
    { value: "9", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Auto-Schedule Engine</h2>
        <p className="text-muted-foreground mt-1">Run the algorithmic scheduler to generate monthly shifts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-3xl overflow-hidden h-full">
            <div className="h-2 w-full bg-gradient-to-r from-accent via-primary to-accent" />
            <CardHeader className="pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-display">Generate Roster</CardTitle>
              <CardDescription className="text-base">
                Select the target month and year. The system will automatically assign A, B, C, and OFF shifts while maintaining a minimum manpower of 7 per day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Target Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-12 rounded-xl bg-card">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Target Month</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="h-12 rounded-xl bg-card">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-500">
                  <strong>Note:</strong> Running this action will overwrite any existing non-locked shifts for the selected month. Leave requests (L) will be preserved.
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-8 px-6">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                onClick={handleGenerate}
                disabled={autoSchedule.isPending}
              >
                {autoSchedule.isPending ? "Computing Algorithm..." : "Run Auto-Scheduler"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-md rounded-3xl overflow-hidden bg-card">
            <CardHeader className="bg-secondary/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" /> Rules Enforced
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Minimum 7 total staff per day.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Prioritize higher manpower in A and B shifts.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Pattern: A → OFF → C → OFF → B.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Respect pre-approved leave (L).
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
