import { useState, useEffect } from "react";
import { Bell, Search, Settings, Menu, LogOut, CheckCircle, XCircle, Calendar, UserPlus, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

type Activity = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  link?: string;
};

type Leave = {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: string;
  leaveTypeName: string;
  createdAt: string;
};

type Notification = {
  id: string;
  type: "activity" | "leave";
  action?: string;
  details: string;
  createdAt: string;
  link?: string;
};

function getNotificationIcon(action: string) {
  switch (action) {
    case "Leave Approved":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "Leave Rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "Leave Applied":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "Employee Added":
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getActivityLink(action: string): string | undefined {
  switch (action) {
    case "Employee Added":
      return "/employees";
    case "Leave Applied":
    case "Leave Approved":
    case "Leave Rejected":
      return "/leave-management";
    default:
      return undefined;
  }
}

interface HeaderProps {
  title: string;
  openSidebar: () => void;
}

export default function Header({ title, openSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  // Get activities and leaves
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/activities'],
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: leaves, isLoading: isLoadingLeaves } = useQuery<Leave[]>({
    queryKey: ['/api/leaves'],
    staleTime: 1000 * 60, // 1 minute
  });

  const isLoading = isLoadingActivities || isLoadingLeaves;

  // Combine and sort notifications
  const notifications: Notification[] = [
    ...(activities?.map(activity => ({
      id: activity.id,
      type: 'activity' as const,
      action: activity.action,
      details: activity.details,
      createdAt: activity.createdAt,
      link: getActivityLink(activity.action)
    })) || []),
    ...(leaves?.map(leave => ({
      id: leave.id,
      type: 'leave' as const,
      action: leave.status === 'pending' ? 'Leave Applied' : `Leave ${leave.status}`,
      details: `${leave.employeeName} applied for ${leave.leaveTypeName} leave`,
      createdAt: leave.createdAt,
      link: '/leave-management'
    })) || [])
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Check for unread notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const lastNotification = notifications[0].createdAt;
      const storedLastViewed = localStorage.getItem('lastViewedNotifications');
      
      if (!storedLastViewed || new Date(lastNotification) > new Date(storedLastViewed)) {
        setHasUnread(true);
      } else {
        setHasUnread(false);
      }
    }
  }, [notifications]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem('lastViewedNotifications', new Date().toISOString());
      setHasUnread(false);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openSidebar} 
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </span>
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 text-sm"
            />
          </div>

          {/* Notifications */}
          <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
                {!isLoading && hasUnread && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-4" align="end" sideOffset={5}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Notifications</h4>
                <Link href="/reports" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {notification.type === "leave" ? (
                          <Calendar className="h-5 w-5 text-primary" />
                        ) : notification.action === "login" ? (
                          <UserPlus className="h-5 w-5 text-green-500" />
                        ) : notification.action === "logout" ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.type === "leave" ? notification.details : notification.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(notification.createdAt, 'relative')}
                        </p>
                        {notification.link && (
                          <Link 
                            href={notification.link} 
                            className="text-xs text-primary hover:underline block"
                          >
                            View details
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-gray-500" />
          </Button>

          {/* Logout Button */}
          {user && (
            <Button
              variant="ghost"
              className="flex items-center text-gray-700 hover:text-primary"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut size={18} className="mr-2" />
              {logoutMutation.isPending ? "..." : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
