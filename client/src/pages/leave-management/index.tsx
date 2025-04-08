import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDate, calculateLeaveDuration, getStatusColor } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays } from "date-fns";
import { CalendarIcon, CheckCircle, Loader2, Plus, UserPlus, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Leave = {
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
  department: string;
  leaveTypeName: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  avatar: string;
  departmentId: number;
  email: string;
};

type LeaveType = {
  id: number;
  name: string;
  description: string;
  allowedDays: number;
  isPaid: boolean;
};

const leaveFormSchema = z.object({
  employeeId: z.coerce.number({
    required_error: "Please select an employee",
  }),
  leaveTypeId: z.coerce.number({
    required_error: "Please select a leave type",
  }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date({
    required_error: "Please select an end date",
  }),
  reason: z.string().optional(), // Make reason optional
});

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const [openApplyLeaveDialog, setOpenApplyLeaveDialog] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 0),
  });

  // Get all leaves or filtered by status
  const { 
    data: leaves, 
    isLoading: isLoadingLeaves,
    refetch: refetchLeaves 
  } = useQuery<Leave[]>({
    queryKey: ['/api/leaves', { status: leaveFilter !== "all" ? leaveFilter : undefined }],
  });

  // Get all employees for the form
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Get all leave types for the form
  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ['/api/leave-types'],
  });

  // Get the employee ID associated with the current user
  const { data: userEmployee } = useQuery({
    queryKey: ['/api/employees', { email: user?.email }],
    queryFn: async () => {
      if (!user?.email) return null;
      const response = await fetch(`/api/employees?email=${user.email}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch employee data');
      }
      return await response.json();
    },
    enabled: !!user?.email,
  });

  const form = useForm<z.infer<typeof leaveFormSchema>>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      employeeId: userEmployee?.id || 0,
      leaveTypeId: 0,
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
    },
  });

  // Update form when user employee data is loaded
  useEffect(() => {
    if (userEmployee?.id) {
      form.setValue('employeeId', userEmployee.id);
    }
  }, [userEmployee, form]);

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      employeeId: userEmployee?.id || 0,
      leaveTypeId: 0,
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
    });
  };

  // Apply for leave mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveFormSchema>) => {
      // Format the dates correctly for the API
      const formattedData = {
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        status: "pending", // All new leaves start as pending
      };

      const res = await apiRequest("POST", "/api/leaves", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Leave request submitted",
        description: "Your leave request has been submitted successfully",
      });
      refetchLeaves();
      setOpenApplyLeaveDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  // Update leave status mutation
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // First get the leave details to ensure we have all the necessary data
      const response = await fetch(`/api/leaves/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get leave details');
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
      toast({
        title: "Leave status updated",
        description: "The leave status has been updated successfully",
      });
      refetchLeaves();
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof leaveFormSchema>) => {
    // Make sure we have a valid employee ID
    if (!userEmployee?.id) {
      toast({
        title: "Employee not found",
        description: "Could not find your employee record. Please contact HR.",
        variant: "destructive",
      });
      return;
    }

    // Set the employeeId explicitly from the userEmployee data
    const formData = {
      ...data,
      employeeId: userEmployee.id
    };

    // Validate that end date is not before start date
    if (formData.endDate < formData.startDate) {
      toast({
        title: "Invalid date range",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    // Check that selected leave type exists
    const selectedLeaveType = leaveTypes?.find(lt => lt.id === formData.leaveTypeId);
    if (!selectedLeaveType) {
      toast({
        title: "Invalid leave type",
        description: "Please select a valid leave type",
        variant: "destructive",
      });
      return;
    }

    // Check if the duration is within the allowed days
    const duration = calculateLeaveDuration(formData.startDate, formData.endDate);
    if (duration > selectedLeaveType.allowedDays) {
      toast({
        title: "Exceeds allowed days",
        description: `This leave type allows a maximum of ${selectedLeaveType.allowedDays} days, but you requested ${duration} days`,
        variant: "destructive",
      });
      return;
    }

    // Log the data being sent
    console.log("Submitting leave request with data:", formData);

    applyLeaveMutation.mutate(formData);
  };

  const handleApprove = (id: number) => {
    updateLeaveStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateLeaveStatusMutation.mutate({ id, status: "rejected" });
  };

  const formatLeaveColumns = (showActions = true) => [
    {
      header: "Employee",
      accessorKey: "employeeId",
      cell: (leave: Leave) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            {leave.employeeAvatar && <AvatarImage src={leave.employeeAvatar} alt={leave.employeeName} />}
            <AvatarFallback>
              {leave.employeeName ? leave.employeeName.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{leave.employeeName}</div>
            <div className="text-sm text-muted-foreground">{leave.department}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Leave Type",
      accessorKey: "leaveTypeId",
      cell: (leave: Leave) => (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">
          {leave.leaveTypeName}
        </Badge>
      ),
    },
    {
      header: "Period",
      accessorKey: "startDate",
      cell: (leave: Leave) => {
        const duration = calculateLeaveDuration(leave.startDate, leave.endDate);
        return (
          <div>
            <div>{formatDate(leave.startDate, "MMM d")} - {formatDate(leave.endDate, "MMM d, yyyy")}</div>
            <div className="text-xs text-muted-foreground">{duration} {duration === 1 ? "day" : "days"}</div>
          </div>
        );
      },
    },
    {
      header: "Reason",
      accessorKey: "reason",
      cell: (leave: Leave) => (
        <div className="max-w-xs truncate">{leave.reason}</div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (leave: Leave) => {
        const { bg, text } = getStatusColor(leave.status);
        return (
          <Badge variant="outline" className={`${bg} ${text} border-none`}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </Badge>
        );
      },
    },
    ...(showActions ? [
      {
        header: "Actions",
        accessorKey: "id",
        cell: (leave: Leave) => (
          leave.status === "pending" && (user?.role === "admin" || user?.role === "hr") ? (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(leave.id);
                }}
                disabled={updateLeaveStatusMutation.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(leave.id);
                }}
                disabled={updateLeaveStatusMutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>
          ) : null
        ),
      },
    ] : []),
  ];

  return (
    <Layout title="Leave Management">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Leave Management</h1>
        
        <div className="flex space-x-2">
          <Dialog open={openApplyLeaveDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setOpenApplyLeaveDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <div className="border rounded p-2 bg-muted/30 cursor-not-allowed">
                          {userEmployee ? (
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                {userEmployee.avatar && <AvatarImage src={userEmployee.avatar} />}
                                <AvatarFallback>
                                  {userEmployee.firstName[0]}{userEmployee.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {userEmployee.firstName} {userEmployee.lastName} ({userEmployee.employeeId})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Loading employee information...</span>
                          )}
                        </div>
                        <FormDescription className="text-xs">
                          You can only request leave for yourself
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value.toString()}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leaveTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} ({type.allowedDays} days, {type.isPaid ? "Paid" : "Unpaid"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < form.getValues().startDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Reason <span className="text-sm text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter reason for leave (optional)..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={applyLeaveMutation.isPending}
                    >
                      {applyLeaveMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Leave Request
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" onClick={() => setLeaveFilter("pending")}>Pending</TabsTrigger>
          <TabsTrigger value="approved" onClick={() => setLeaveFilter("approved")}>Approved</TabsTrigger>
          <TabsTrigger value="rejected" onClick={() => setLeaveFilter("rejected")}>Rejected</TabsTrigger>
          <TabsTrigger value="all" onClick={() => setLeaveFilter("all")}>All Leaves</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DataTable
            columns={formatLeaveColumns(true)}
            data={leaves?.filter(leave => leave.status === "pending") || []}
            isLoading={isLoadingLeaves}
            pagination={true}
            exportable={true}
            fileName="pending-leaves"
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-lg font-medium mb-2">No pending leave requests</h3>
                <p className="text-muted-foreground mb-4">
                  There are no pending leave requests to review.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="approved">
          <DataTable
            columns={formatLeaveColumns(false)}
            data={leaves?.filter(leave => leave.status === "approved") || []}
            isLoading={isLoadingLeaves}
            pagination={true}
            exportable={true}
            fileName="approved-leaves"
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium mb-2">No approved leave requests</h3>
                <p className="text-muted-foreground mb-4">
                  There are no approved leave requests yet.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="rejected">
          <DataTable
            columns={formatLeaveColumns(false)}
            data={leaves?.filter(leave => leave.status === "rejected") || []}
            isLoading={isLoadingLeaves}
            pagination={true}
            exportable={true}
            fileName="rejected-leaves"
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">🙅</div>
                <h3 className="text-lg font-medium mb-2">No rejected leave requests</h3>
                <p className="text-muted-foreground mb-4">
                  There are no rejected leave requests.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="all">
          <DataTable
            columns={formatLeaveColumns()}
            data={leaves || []}
            isLoading={isLoadingLeaves}
            pagination={true}
            exportable={true}
            fileName="all-leaves"
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No leave requests found</h3>
                <p className="text-muted-foreground mb-4">
                  There are no leave requests in the system.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Apply for Leave
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Leave Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-[300px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setDateRange({ 
                            from: range.from, 
                            to: range.to || range.from 
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                {leaves && leaves.length > 0 ? (
                  leaves
                    .filter(leave => {
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      return (
                        (startDate >= dateRange.from && startDate <= dateRange.to) ||
                        (endDate >= dateRange.from && endDate <= dateRange.to) ||
                        (startDate <= dateRange.from && endDate >= dateRange.to)
                      );
                    })
                    .map(leave => (
                      <div 
                        key={leave.id} 
                        className={`p-4 rounded-lg border ${
                          leave.status === 'approved' 
                            ? 'border-green-200 bg-green-50' 
                            : leave.status === 'rejected'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              {leave.employeeAvatar && <AvatarImage src={leave.employeeAvatar} alt={leave.employeeName} />}
                              <AvatarFallback>
                                {leave.employeeName ? leave.employeeName.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{leave.employeeName}</div>
                              <div className="text-xs text-muted-foreground">{leave.department}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${getStatusColor(leave.status).bg} ${getStatusColor(leave.status).text} border-none`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="ml-10 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{leave.leaveTypeName}</span>
                            <span>{calculateLeaveDuration(leave.startDate, leave.endDate)} days</span>
                          </div>
                          <div>{formatDate(leave.startDate, "MMM d")} - {formatDate(leave.endDate, "MMM d, yyyy")}</div>
                          <div className="text-muted-foreground italic">"{leave.reason}"</div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No leave requests found for the selected date range
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
