import { cn } from "@/lib/utils";

interface ShiftBadgeProps {
  shift: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ShiftBadge({ shift, className, size = 'md' }: ShiftBadgeProps) {
  const shiftLower = shift?.toLowerCase() || '';
  
  // Mapping API shift types to our custom CSS classes defined in index.css
  let shiftClass = 'bg-gray-100 text-gray-500'; // fallback
  
  if (['a', 'b', 'c', 'off', 'l', 'g'].includes(shiftLower)) {
    shiftClass = `shift-${shiftLower}`;
  }

  const sizeClasses = {
    sm: 'text-[10px] w-6 h-6 rounded-md',
    md: 'text-xs w-8 h-8 rounded-lg',
    lg: 'text-sm w-10 h-10 rounded-xl'
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center font-bold tracking-wider shadow-sm transition-all duration-200",
        shiftClass,
        sizeClasses[size],
        className
      )}
      title={`Shift: ${shift}`}
    >
      {shift}
    </div>
  );
}
