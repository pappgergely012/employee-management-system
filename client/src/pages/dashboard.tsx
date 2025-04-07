import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/dashboard/stats-card";
import RecentActivities from "@/components/dashboard/recent-activities";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import DepartmentDistribution from "@/components/dashboard/department-distribution";
import RecentEmployees from "@/components/dashboard/recent-employees";
import PendingLeaveRequests from "@/components/dashboard/pending-leave-requests";
import QuickLinks from "@/components/dashboard/quick-links";
import { Users, CheckCircle, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalEmployees: number;
  activeToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
};

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  return (
    <Layout title="Dashboard">
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[150px] rounded-lg" />
              <Skeleton className="h-[150px] rounded-lg" />
              <Skeleton className="h-[150px] rounded-lg" />
              <Skeleton className="h-[150px] rounded-lg" />
            </>
          ) : error ? (
            <div className="col-span-4 bg-red-50 text-red-500 p-4 rounded-lg">
              Failed to load dashboard stats
            </div>
          ) : (
            <>
              <StatsCard
                title="Total Employees"
                value={stats?.totalEmployees || 0}
                icon={<Users className="h-6 w-6" />}
                iconBgColor="bg-blue-100"
                iconColor="text-primary"
                change={{
                  value: "3.8%",
                  trend: "up",
                  text: "Since last month"
                }}
              />
              
              <StatsCard
                title="Active Today"
                value={stats?.activeToday || 0}
                icon={<CheckCircle className="h-6 w-6" />}
                iconBgColor="bg-green-100"
                iconColor="text-secondary"
                change={{
                  value: `${stats ? ((stats.activeToday / stats.totalEmployees) * 100).toFixed(1) : 0}%`,
                  trend: "neutral",
                  text: "attendance rate"
                }}
              />
              
              <StatsCard
                title="On Leave Today"
                value={stats?.onLeaveToday || 0}
                icon={<Calendar className="h-6 w-6" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-warning"
                change={{
                  value: "2.1%",
                  trend: "down",
                  text: "Since last week"
                }}
              />
              
              <StatsCard
                title="Pending Requests"
                value={stats?.pendingLeaveRequests || 0}
                icon={<Clock className="h-6 w-6" />}
                iconBgColor="bg-purple-100"
                iconColor="text-accent"
              />
            </>
          )}
        </div>

        {/* Recent Activity and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentActivities />
          <UpcomingEvents />
        </div>

        {/* Department Distribution */}
        <DepartmentDistribution />
        
        {/* Recent Employees & Pending Leave Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentEmployees />
          <PendingLeaveRequests />
        </div>
        
        {/* Quick Links */}
        <QuickLinks />
      </div>
    </Layout>
  );
}
