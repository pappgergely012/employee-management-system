import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    text: string;
  };
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor,
  change 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div 
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              iconBgColor
            )}
          >
            <div className={cn("h-6 w-6", iconColor)}>
              {icon}
            </div>
          </div>
        </div>

        {change && (
          <div className="mt-4">
            <div className="flex items-center">
              <span 
                className={cn(
                  "text-xs font-medium flex items-center",
                  {
                    "text-success": change.trend === "up",
                    "text-error": change.trend === "down",
                    "text-gray-500": change.trend === "neutral"
                  }
                )}
              >
                {change.trend === "up" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {change.trend === "down" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {change.value}
              </span>
              <span className="text-xs text-gray-500 ml-2">{change.text}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
