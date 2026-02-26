import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateSchedule } from "@/hooks/use-schedules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { CalendarX2, ArrowRight } from "lucide-react";

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const updateSchedule = useUpdateSchedule();

  const handleSubmit = async () => {
    if (!user || !date) return;

    const formattedDate = format(date, "yyyy-MM-dd");

    try {
      await updateSchedule.mutateAsync({
        employeeId: user.id,
        date: formattedDate,
        shift: "L", // L for Leave
      });
      
      toast({
        title: "Leave Requested",
        description: `Your leave for ${format(date, "MMMM do, yyyy")} has been recorded.`,
      });
      
      // Reset form somewhat, or keep date for multiple
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Could not process request",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Request Leave</h2>
        <p className="text-muted-foreground mt-1">Submit a leave request for a specific date.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-lg shadow-black/5 rounded-3xl overflow-hidden">
          <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <CalendarX2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-display">Select Date</CardTitle>
            <CardDescription>Choose the day you need to take off.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-xl border border-border/50 shadow-sm p-4 bg-card"
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg shadow-black/5 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
            <CardTitle className="text-xl font-display">Confirm Request</CardTitle>
            <CardDescription>Review your leave details before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Employee</p>
                  <p className="text-lg font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.empNo}</p>
                </div>
                
                <div className="h-px w-full bg-border" />
                
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Selected Date</p>
                  {date ? (
                    <p className="text-lg font-medium text-foreground flex items-center gap-2">
                      {format(date, "EEEE, MMMM do, yyyy")}
                    </p>
                  ) : (
                    <p className="text-lg text-muted-foreground italic">No date selected</p>
                  )}
                </div>
                
                <div className="h-px w-full bg-border" />
                
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Action</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium px-3 py-1 bg-card rounded-lg border border-border">Current Shift</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold px-3 py-1 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">Leave (L)</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 mt-6 rounded-xl text-base font-bold shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:-translate-y-0.5 transition-all"
              onClick={handleSubmit}
              disabled={!date || updateSchedule.isPending}
            >
              {updateSchedule.isPending ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
