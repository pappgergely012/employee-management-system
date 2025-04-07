import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";

type Activity = {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  username: string;
  userFullName: string;
  userAvatar: string;
};

function getActivityIcon(action: string) {
  switch (action) {
    case "Employee Added":
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    case "Leave Approved":
    case "Leave Applied":
    case "Leave Updated":
      return (
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case "Attendance Marked":
    case "Event Created":
      return (
        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      );
    case "Salary Created":
    case "Salary Updated":
      return (
        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

export default function RecentActivities() {
  const { data, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/activities'],
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      
      {isLoading ? (
        <CardContent className="divide-y divide-gray-200">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="px-6 py-4 flex items-start">
              <Skeleton className="h-10 w-10 rounded-full mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      ) : error ? (
        <CardContent className="p-6 text-center text-error">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <p>Failed to load activities</p>
        </CardContent>
      ) : (
        <>
          <CardContent className="divide-y divide-gray-200 p-0">
            {data && data.length > 0 ? (
              data.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-start hover:bg-gray-50 transition-colors">
                  {getActivityIcon(activity.action)}
                  <div>
                    <p className="text-sm font-medium">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.createdAt, 'relative')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No recent activities found
              </div>
            )}
          </CardContent>
          <CardFooter className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Link href="/reports">
              <a className="w-full text-center text-sm font-medium text-primary hover:underline">
                View all activities
              </a>
            </Link>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
