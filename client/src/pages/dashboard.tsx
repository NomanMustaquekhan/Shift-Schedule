import { useState, useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays, getYear, getMonth } from "date-fns";
import { useSchedules, useEmployees } from "@/hooks/use-schedules";
import { Card } from "@/components/ui/card";
import { ShiftBadge } from "@/components/ShiftBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, Users, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const yearStr = getYear(currentDate).toString();
  // Month is 0-indexed in JS dates, but our API might expect 1-indexed. Assuming 1-indexed for DB storage based on common patterns.
  const monthStr = (getMonth(currentDate) + 1).toString().padStart(2, '0');

  const { data: employees, isLoading: loadingEmps } = useEmployees();
  const { data: schedules, isLoading: loadingScheds } = useSchedules(yearStr, monthStr);

  const daysInMonth = getDaysInMonth(currentDate);
  const monthStart = startOfMonth(currentDate);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));

  // Create a quick lookup map for schedules: map[`${empId}-${dateStr}`] = shift
  const scheduleMap = useMemo(() => {
    if (!schedules) return new Map();
    const map = new Map<string, string>();
    schedules.forEach(s => {
      map.set(`${s.employeeId}-${s.date}`, s.shift);
    });
    return map;
  }, [schedules]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(getYear(prev), getMonth(prev) - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(getYear(prev), getMonth(prev) + 1, 1));
  };

  const isLoading = loadingEmps || loadingScheds;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Monthly Roster</h2>
          <p className="text-muted-foreground mt-1">View and manage employee shifts</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-xl hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-40 text-center font-display font-semibold text-foreground">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-xl hover:bg-secondary">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-secondary/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <h3 className="text-2xl font-display font-bold text-foreground">
                {employees?.length || 0}
              </h3>
            </div>
          </div>
        </Card>
        
        <div className="col-span-1 lg:col-span-3 flex items-center gap-2 flex-wrap bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <span className="text-sm font-semibold text-muted-foreground mr-2">Legend:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"><ShiftBadge shift="A" size="sm" /> <span className="text-xs font-medium">Morning (6AM-2PM)</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"><ShiftBadge shift="B" size="sm" /> <span className="text-xs font-medium">Afternoon (2PM-10PM)</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"><ShiftBadge shift="C" size="sm" /> <span className="text-xs font-medium">Night (10PM-6AM)</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"><ShiftBadge shift="OFF" size="sm" /> <span className="text-xs font-medium">Weekly Off</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"><ShiftBadge shift="L" size="sm" /> <span className="text-xs font-medium">Leave</span></div>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg shadow-black/5 rounded-3xl overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground">No employees found</h3>
            <p className="text-muted-foreground mt-2">Add employees to the database to view schedules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-18rem)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-secondary/80 backdrop-blur-md p-4 text-left font-semibold text-foreground border-b border-r border-border/50 w-[250px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    Employee
                  </th>
                  {days.map((day) => (
                    <th key={day.toISOString()} className="p-3 text-center border-b border-r border-border/50 min-w-[50px] bg-secondary/30">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{format(day, 'EEE')}</span>
                        <span className="text-base font-display font-bold text-foreground mt-0.5">{format(day, 'd')}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="sticky left-0 z-10 bg-card group-hover:bg-secondary/40 p-3 border-b border-r border-border/50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{emp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.empNo} • {emp.section}</p>
                        </div>
                      </div>
                    </td>
                    {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const shift = scheduleMap.get(`${emp.id}-${dateStr}`) || '-';
                      return (
                        <td key={dateStr} className="p-2 border-b border-r border-border/50 text-center">
                          {shift !== '-' ? (
                            <ShiftBadge shift={shift} className="mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
