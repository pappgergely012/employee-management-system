import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";

type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  createdBy: number;
  createdAt: string;
  creatorName: string;
};

export default function UpcomingEvents() {
  const { data, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events/upcoming'],
  });

  const getMonthName = (date: string) => {
    return new Date(date).toLocaleString('default', { month: 'short' }).toUpperCase();
  };

  const getDay = (date: string) => {
    return new Date(date).getDate();
  };
  
  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "All Day";
    return `${startTime} - ${endTime}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
      </CardHeader>
      
      {isLoading ? (
        <CardContent className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-6 flex items-start">
              <Skeleton className="h-14 w-12 mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      ) : error ? (
        <CardContent className="p-6 text-center text-error">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <p>Failed to load events</p>
        </CardContent>
      ) : (
        <>
          <CardContent className="divide-y divide-gray-200 p-0">
            {data && data.length > 0 ? (
              data.map((event) => (
                <div key={event.id} className="p-6 flex items-start hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center mr-4">
                    <div className="text-xs font-bold text-gray-500">{getMonthName(event.startDate)}</div>
                    <div className={`text-xl font-bold ${new Date(event.startDate).getDate() === new Date().getDate() ? 'text-red-600' : 'text-gray-800'}`}>
                      {getDay(event.startDate)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeRange(event.startTime, event.endTime)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                    )}
                    {event.startDate !== event.endDate && (
                      <div className="mt-1 text-xs text-primary">
                        {formatDate(event.startDate, 'MMM d')} - {formatDate(event.endDate, 'MMM d, yyyy')}
                      </div>
                    )}
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No upcoming events
              </div>
            )}
          </CardContent>
          <CardFooter className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Link href="/reports">
              <a className="w-full text-center text-sm font-medium text-primary hover:underline">
                View calendar
              </a>
            </Link>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
