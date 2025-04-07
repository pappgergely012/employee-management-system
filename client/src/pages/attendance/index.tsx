import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, getStatusColor } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

type Attendance = {
  id: number;
  employeeId: number;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  remarks: string;
  createdAt: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  avatar: string;
  departmentId: number;
};

const statusOptions = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
];

const attendanceFormSchema = z.object({
  employeeId: z.coerce.number({
    required_error: "Please select an employee",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  status: z.string({
    required_error: "Please select a status",
  }),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  remarks: z.string().optional(),
});

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [updateMode, setUpdateMode] = useState<boolean>(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // Get attendance data for the selected date
  const { 
    data: attendanceData, 
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance 
  } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance', { date: selectedDate.toISOString() }],
  });

  // Get all employees for the form
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<z.infer<typeof attendanceFormSchema>>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      employeeId: 0,
      date: new Date(),
      status: "present",
      checkIn: "",
      checkOut: "",
      remarks: "",
    },
  });

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      employeeId: 0,
      date: selectedDate,
      status: "present",
      checkIn: "",
      checkOut: "",
      remarks: "",
    });
    setUpdateMode(false);
    setSelectedAttendance(null);
  };

  // Set form values when editing attendance
  const setFormForEdit = (attendance: Attendance) => {
    form.reset({
      employeeId: attendance.employeeId,
      date: new Date(attendance.date),
      status: attendance.status,
      checkIn: attendance.checkIn ? new Date(attendance.checkIn).toTimeString().slice(0, 5) : "",
      checkOut: attendance.checkOut ? new Date(attendance.checkOut).toTimeString().slice(0, 5) : "",
      remarks: attendance.remarks || "",
    });
    setUpdateMode(true);
    setSelectedAttendance(attendance);
    setOpenAddDialog(true);
  };

  // Create attendance mutation
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendanceFormSchema>) => {
      // Format the date and times correctly for the API
      const date = format(data.date, "yyyy-MM-dd");
      
      let checkIn = null;
      if (data.checkIn) {
        const checkInDate = new Date(data.date);
        const [hours, minutes] = data.checkIn.split(":");
        checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        checkIn = checkInDate.toISOString();
      }
      
      let checkOut = null;
      if (data.checkOut) {
        const checkOutDate = new Date(data.date);
        const [hours, minutes] = data.checkOut.split(":");
        checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        checkOut = checkOutDate.toISOString();
      }

      const formattedData = {
        employeeId: data.employeeId,
        date,
        status: data.status,
        checkIn,
        checkOut,
        remarks: data.remarks,
      };

      const res = await apiRequest("POST", "/api/attendance", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance marked",
        description: "Attendance has been marked successfully",
      });
      refetchAttendance();
      setOpenAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendanceFormSchema>) => {
      if (!selectedAttendance) return null;

      // Format the date and times correctly for the API
      const date = format(data.date, "yyyy-MM-dd");
      
      let checkIn = null;
      if (data.checkIn) {
        const checkInDate = new Date(data.date);
        const [hours, minutes] = data.checkIn.split(":");
        checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        checkIn = checkInDate.toISOString();
      }
      
      let checkOut = null;
      if (data.checkOut) {
        const checkOutDate = new Date(data.date);
        const [hours, minutes] = data.checkOut.split(":");
        checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        checkOut = checkOutDate.toISOString();
      }

      const formattedData = {
        employeeId: data.employeeId,
        date,
        status: data.status,
        checkIn,
        checkOut,
        remarks: data.remarks,
      };

      const res = await apiRequest("PUT", `/api/attendance/${selectedAttendance.id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance updated",
        description: "Attendance has been updated successfully",
      });
      refetchAttendance();
      setOpenAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof attendanceFormSchema>) => {
    if (updateMode) {
      updateAttendanceMutation.mutate(data);
    } else {
      createAttendanceMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: "Employee",
      accessorKey: "employeeId",
      cell: (attendance: Attendance) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            {attendance.employeeAvatar && <AvatarImage src={attendance.employeeAvatar} alt={attendance.employeeName} />}
            <AvatarFallback>
              {attendance.employeeName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{attendance.employeeName}</div>
            <div className="text-sm text-muted-foreground">{attendance.department}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (attendance: Attendance) => formatDate(attendance.date, "PP"),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (attendance: Attendance) => {
        const { bg, text } = getStatusColor(attendance.status);
        return (
          <Badge variant="outline" className={`${bg} ${text}`}>
            {attendance.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        );
      },
    },
    {
      header: "Check In",
      accessorKey: "checkIn",
      cell: (attendance: Attendance) => 
        attendance.checkIn ? formatDate(attendance.checkIn, "p") : "N/A",
    },
    {
      header: "Check Out",
      accessorKey: "checkOut",
      cell: (attendance: Attendance) => 
        attendance.checkOut ? formatDate(attendance.checkOut, "p") : "N/A",
    },
    {
      header: "Remarks",
      accessorKey: "remarks",
      cell: (attendance: Attendance) => attendance.remarks || "-",
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (attendance: Attendance) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            setFormForEdit(attendance);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Layout title="Attendance">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Attendance Management</h1>
        
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={() => refetchAttendance()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>

          <Dialog open={openAddDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setOpenAddDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{updateMode ? "Update Attendance" : "Mark Attendance"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value.toString()}
                          value={field.value.toString()}
                          disabled={updateMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName} ({employee.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
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
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("status") !== "absent" && (
                      <>
                        <FormField
                          control={form.control}
                          name="checkIn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Check In</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="checkOut"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Check Out</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                    >
                      {(createAttendanceMutation.isPending || updateAttendanceMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {updateMode ? "Update" : "Mark"} Attendance
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
          <TabsTrigger value="stats">Attendance Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DataTable
            columns={columns}
            data={attendanceData || []}
            isLoading={isLoadingAttendance}
            pagination={true}
            exportable={true}
            fileName={`attendance-${format(selectedDate, "yyyy-MM-dd")}`}
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
                <p className="text-muted-foreground mb-4">
                  No attendance records for {format(selectedDate, "MMMM d, yyyy")}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceData ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                        <div className="text-sm font-medium">Present</div>
                        <div className="text-2xl font-bold">
                          {attendanceData.filter(a => a.status === "present").length}
                        </div>
                      </div>
                      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                        <div className="text-sm font-medium">Absent</div>
                        <div className="text-2xl font-bold">
                          {attendanceData.filter(a => a.status === "absent").length}
                        </div>
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                        <div className="text-sm font-medium">Late</div>
                        <div className="text-2xl font-bold">
                          {attendanceData.filter(a => a.status === "late").length}
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                        <div className="text-sm font-medium">Half Day</div>
                        <div className="text-2xl font-bold">
                          {attendanceData.filter(a => a.status === "half_day").length}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      No data available for selected date.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceData && attendanceData.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Attendance Rate</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          (attendanceData.filter(a => a.status === "present" || a.status === "late").length / 
                          attendanceData.length) * 100
                        )}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${Math.round(
                            (attendanceData.filter(a => a.status === "present" || a.status === "late").length / 
                            attendanceData.length) * 100
                          )}%` 
                        }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attendanceData.filter(a => a.status === "present" || a.status === "late").length} of {attendanceData.length} employees present today.
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No data available for selected date.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
