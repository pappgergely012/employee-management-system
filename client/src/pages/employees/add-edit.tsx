import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import Layout from "@/components/layout/layout";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft, Save, CheckCircle, XCircle } from "lucide-react";
import { insertEmployeeSchema, Employee, Leave } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { generateEmployeeId, cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const formSchema = z.object({
  employeeId: z.string().min(3, "Employee ID is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  departmentId: z.coerce.number().min(1, "Department is required"),
  designationId: z.coerce.number().min(1, "Designation is required"),
  employeeTypeId: z.coerce.number().min(1, "Employee type is required"),
  shiftId: z.coerce.number().min(1, "Shift is required"),
  locationId: z.coerce.number().min(1, "Location is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  gender: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Define interface for leave type details
interface LeaveTypeDetail {
  id: number;
  name: string;
  allowedDays: number;
}

// Extend the Leave type to include leaveType details
interface LeaveWithType extends Leave {
  leaveType?: LeaveTypeDetail;
}

export default function AddEditEmployee() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditMode = Boolean(params.id);
  const [activeTab, setActiveTab] = useState("personal");

  // Get employee data if in edit mode
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: ['/api/employees', Number(params.id)],
    queryFn: async () => {
      console.log("Fetching employee with ID:", params.id);
      // Directly fetch the employee data by ID
      const response = await fetch(`/api/employees/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee data');
      }
      return response.json();
    },
    enabled: isEditMode,
  });

  // Fetch lookup data
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['/api/designations'],
  });

  const { data: employeeTypes = [] } = useQuery({
    queryKey: ['/api/employee-types'],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts'],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
  });
  
  // Get leave types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['/api/leave-types'],
  });
  
  // Get employee leaves if in edit mode
  const { data: employeeLeaves = [], isLoading: isLoadingLeaves } = useQuery<LeaveWithType[]>({
    queryKey: ['/api/leaves/employee', Number(params.id)],
    queryFn: async () => {
      const response = await fetch(`/api/leaves/employee/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee leaves');
      }
      return response.json();
    },
    enabled: isEditMode,
  });

  // Filter designations based on selected department
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const filteredDesignations = designations.filter(
    (designation: any) => designation.departmentId === selectedDepartmentId
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      departmentId: 0,
      designationId: 0,
      employeeTypeId: 0,
      shiftId: 0,
      locationId: 0,
      dateOfJoining: new Date().toISOString().split('T')[0],
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      gender: "",
      avatar: "",
      isActive: true,
    },
  });

  // Update form values when employee data is loaded
  useEffect(() => {
    if (employee && isEditMode) {
      console.log("Setting form values from employee data:", employee);
      
      try {
        // Format dates properly
        let dateOfJoining = "";
        let dateOfBirth = "";
        
        // Handle dateOfJoining - this is required
        if (employee.dateOfJoining) {
          const joinDate = new Date(employee.dateOfJoining);
          if (!isNaN(joinDate.getTime())) {
            dateOfJoining = joinDate.toISOString().split('T')[0];
          }
        }
        
        // Handle dateOfBirth - this is optional
        if (employee.dateOfBirth) {
          const birthDate = new Date(employee.dateOfBirth);
          if (!isNaN(birthDate.getTime())) {
            dateOfBirth = birthDate.toISOString().split('T')[0];
          }
        }
        
        // Use setValue for each field to ensure proper state updates
        form.setValue('employeeId', employee.employeeId);
        form.setValue('firstName', employee.firstName);
        form.setValue('lastName', employee.lastName);
        form.setValue('email', employee.email);
        form.setValue('phone', employee.phone || "");
        form.setValue('departmentId', employee.departmentId);
        form.setValue('designationId', employee.designationId);
        form.setValue('employeeTypeId', employee.employeeTypeId);
        form.setValue('shiftId', employee.shiftId);
        form.setValue('locationId', employee.locationId);
        form.setValue('dateOfJoining', dateOfJoining);
        form.setValue('dateOfBirth', dateOfBirth);
        form.setValue('address', employee.address || "");
        form.setValue('city', employee.city || "");
        form.setValue('state', employee.state || "");
        form.setValue('country', employee.country || "");
        form.setValue('zipCode', employee.zipCode || "");
        form.setValue('gender', employee.gender || "");
        form.setValue('avatar', employee.avatar || "");
        form.setValue('isActive', employee.isActive);
        
        // Also set selected department to filter designations
        setSelectedDepartmentId(employee.departmentId);
      } catch (error) {
        console.error("Error setting form values:", error);
      }
    }
  }, [employee, isEditMode, form]);

  // Generate employee ID for new employees
  useEffect(() => {
    if (!isEditMode && departments && Array.isArray(departments) && departments.length > 0) {
      const selectedDept = departments.find((dept: any) => dept.id === selectedDepartmentId);
      if (selectedDept) {
        const deptPrefix = selectedDept.name.substring(0, 3).toUpperCase();
        const newEmployeeId = generateEmployeeId(deptPrefix, departments.length + 1);
        form.setValue('employeeId', newEmployeeId);
      }
    }
  }, [selectedDepartmentId, departments, isEditMode, form]);

  // Handle department change to filter designations
  const handleDepartmentChange = (departmentId: string) => {
    const departmentIdNumber = parseInt(departmentId, 10);
    setSelectedDepartmentId(departmentIdNumber);
    form.setValue("departmentId", departmentIdNumber);
    form.setValue("designationId", 0); // Reset designation when department changes
  };

  // Create/Update mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-employees'] });
      setLocation("/employees");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/employees/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', Number(params.id)] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-employees'] });
      setLocation("/employees");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    },
  });
  
  // Add utility functions for leave management
  const calculateLeaveDuration = (startDate: string, endDate: string): number => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return differenceInDays(end, start) + 1; // Include both start and end day
    } catch (error) {
      console.error('Error calculating leave duration:', error);
      return 0;
    }
  };
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/leaves/employee', Number(params.id)] });
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

  const handleApprove = (id: number) => {
    updateLeaveStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateLeaveStatusMutation.mutate({ id, status: "rejected" });
  };
  
  // Prepare data for pie chart
  const preparePieChartData = () => {
    // Calculate total allowed leaves from all leave types
    const totalAllowedLeaves = leaveTypes.reduce((total: number, leaveType: any) => 
      total + leaveType.allowedDays, 0);
    
    // Calculate used leaves
    const usedLeaves = employeeLeaves
      .filter(leave => leave.status === "approved")
      .reduce((total, leave) => 
        total + calculateLeaveDuration(leave.startDate, leave.endDate), 0);
    
    // Calculate remaining leaves
    const remainingLeaves = Math.max(0, totalAllowedLeaves - usedLeaves);
    
    return [
      { name: "Used Leaves", value: usedLeaves, color: "#4338ca" },
      { name: "Remaining Leaves", value: remainingLeaves, color: "#22c55e" }
    ];
  };
  
  const pieChartData = preparePieChartData();

  // Form submission
  const onSubmit = (data: FormValues) => {
    // Ensure dates are properly formatted
    const formattedData = {
      ...data,
      // Ensure date values are properly formatted or set to undefined if invalid
      dateOfJoining: data.dateOfJoining || new Date().toISOString().split('T')[0],
      dateOfBirth: data.dateOfBirth || undefined
    };
    
    if (isEditMode) {
      updateEmployeeMutation.mutate(formattedData);
    } else {
      createEmployeeMutation.mutate(formattedData);
    }
  };

  if (isEditMode && isLoadingEmployee) {
    return (
      <Layout title="Edit Employee">
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isPending = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <Layout title={isEditMode ? "Edit Employee" : "Add Employee"}>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => setLocation("/employees")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          <h1 className="text-2xl font-semibold">{isEditMode ? "Edit Employee" : "Add New Employee"}</h1>
        </div>

        <Button
          type="submit"
          form="employee-form"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Updating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? "Update Employee" : "Save Employee"}
            </>
          )}
        </Button>
      </div>

      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment Details</TabsTrigger>
            <TabsTrigger value="address">Address & Contact</TabsTrigger>
            {isEditMode && <TabsTrigger value="leaves">Leaves</TabsTrigger>}
          </TabsList>

          <div>
            <Form {...form}>
              <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="First Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="Last Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || ""}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="Avatar URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID*</FormLabel>
                              <FormControl>
                                <Input placeholder="Employee ID" {...field} readOnly={isEditMode} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email*</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="departmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department*</FormLabel>
                              <Select
                                onValueChange={(value) => handleDepartmentChange(value)}
                                defaultValue={field.value ? field.value.toString() : ""}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(departments) && departments.map((department: any) => (
                                    <SelectItem key={department.id} value={department.id.toString()}>
                                      {department.name}
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
                          name="designationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Designation*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value ? field.value.toString() : ""}
                                value={field.value ? field.value.toString() : ""}
                                disabled={!selectedDepartmentId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Designation" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredDesignations.map((designation: any) => (
                                    <SelectItem key={designation.id} value={designation.id.toString()}>
                                      {designation.name}
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
                          name="employeeTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Type*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value ? field.value.toString() : ""}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Employee Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(employeeTypes) && employeeTypes.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name}
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
                          name="shiftId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shift*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value ? field.value.toString() : ""}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Shift" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(shifts) && shifts.map((shift: any) => (
                                    <SelectItem key={shift.id} value={shift.id.toString()}>
                                      {shift.name} ({shift.startTime} - {shift.endTime})
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
                          name="locationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value ? field.value.toString() : ""}
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(locations) && locations.map((location: any) => (
                                    <SelectItem key={location.id} value={location.id.toString()}>
                                      {location.name}
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
                          name="dateOfJoining"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Joining*</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Status</FormLabel>
                                <FormDescription>
                                  Is this employee currently active?
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="address">
                  <Card>
                    <CardHeader>
                      <CardTitle>Address & Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Street address"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input placeholder="State/Province" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip/Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Zip/Postal Code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </form>
            </Form>

            {isEditMode && (
              <TabsContent value="leaves">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Leave summary card with pie chart */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Leave Summary</CardTitle>
                      <CardDescription>
                        Overview of employee's leave allocation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLeaves ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieChartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                  {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} days`, ""]} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">Total Allocated Leaves:</span>
                              <span>{pieChartData.reduce((total, item) => total + item.value, 0)} days</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">Used Leaves:</span>
                              <span>{pieChartData[0].value} days</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">Remaining Leaves:</span>
                              <span>{pieChartData[1].value} days</span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Leave requests list with approve/reject buttons */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Leave Requests</CardTitle>
                      <CardDescription>
                        View and manage employee leave requests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLeaves ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : employeeLeaves.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">📅</div>
                          <h3 className="text-lg font-medium mb-2">No Leave Records</h3>
                          <p className="text-muted-foreground">
                            This employee hasn't applied for any leaves yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {employeeLeaves.map((leave) => {
                            const duration = calculateLeaveDuration(leave.startDate, leave.endDate);
                            const isPending = leave.status.toLowerCase() === "pending";
                            
                            // Function to get status-specific styles
                            const getStatusColor = (status: string) => {
                              const statusLower = status.toLowerCase();
                              if (statusLower === "approved") return "bg-green-100 text-green-800";
                              if (statusLower === "rejected") return "bg-red-100 text-red-800";
                              return "bg-yellow-100 text-yellow-800";
                            };
                            
                            return (
                              <div 
                                key={leave.id} 
                                className="border rounded-lg p-4 shadow-sm transition-shadow hover:shadow"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">
                                      {leave.leaveType?.name || "Leave"} 
                                      <span className="text-sm text-muted-foreground ml-2">
                                        ({duration} {duration === 1 ? "day" : "days"})
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(parseISO(leave.startDate), "MMM d, yyyy")} - {format(parseISO(leave.endDate), "MMM d, yyyy")}
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(leave.status)}>
                                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                  </Badge>
                                </div>
                                
                                {leave.reason && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Reason:</span> {leave.reason}
                                  </div>
                                )}
                                
                                {isPending && (
                                  <div className="mt-3 flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-[30px] text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleApprove(leave.id)}
                                      disabled={updateLeaveStatusMutation.isPending}
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-[30px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleReject(leave.id)}
                                      disabled={updateLeaveStatusMutation.isPending}
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}