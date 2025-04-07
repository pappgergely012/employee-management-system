import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { formatDate, calculateLeaveDuration } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy?: number;
  createdAt: string;
  employeeName: string;
  employeeAvatar: string;
  leaveTypeName: string;
  department: string;
};

export default function PendingLeaveRequests() {
  const { data, isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/dashboard/pending-leaves'],
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // First get the leave details to ensure we have all the necessary data
      const response = await fetch(`/api/leaves/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get leave request');
      }
      
      const leave = await response.json();
      
      // Update only the status
      const res = await apiRequest("PUT", `/api/leaves/${id}`, {
        ...leave,
        status,
      });
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
      
      toast({
        title: "Leave request updated",
        description: "The leave request has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update leave request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateLeaveMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateLeaveMutation.mutate({ id, status: "rejected" });
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Pending Leave Requests</CardTitle>
        <Link href="/leave-management">
          <a className="text-sm font-medium text-primary hover:underline">View all</a>
        </Link>
      </CardHeader>
      
      {isLoading ? (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(3)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-20 ml-3" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-16 rounded" />
                        <Skeleton className="h-8 w-16 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      ) : error ? (
        <CardContent className="p-6 text-center text-error">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <p>Failed to load leave requests</p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data && data.length > 0 ? (
                  data.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            {leave.employeeAvatar && <AvatarImage src={leave.employeeAvatar} alt={leave.employeeName} />}
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                              {getInitials(leave.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{leave.employeeName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">
                          {leave.leaveTypeName}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(leave.startDate, 'MMM d')} - {formatDate(leave.endDate, 'MMM d')}
                        <span className="text-xs text-gray-400 block">
                          ({calculateLeaveDuration(leave.startDate, leave.endDate)} days)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 flex items-center"
                            onClick={() => handleApprove(leave.id)}
                            disabled={updateLeaveMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="px-2 py-1 text-xs text-white rounded hover:bg-error/90 flex items-center"
                            onClick={() => handleReject(leave.id)}
                            disabled={updateLeaveMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No pending leave requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
