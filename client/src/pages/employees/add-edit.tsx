import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import Layout from "@/components/layout/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { insertEmployeeSchema, Employee, Leave } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { generateEmployeeId, cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

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
  const [calendarView, setCalendarView] = useState<"week" | "month" | "year">("month");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

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

  // Get master data
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
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Active</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Is this employee currently active?
                                </p>
                              </div>
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
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Address" {...field} />
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
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} />
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
                              <FormLabel>Zip Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Zip Code" {...field} />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Leave History</CardTitle>
                    <CardDescription>
                      View and manage employee leave records
                    </CardDescription>
                    <div className="flex space-x-4 mt-4">
                      <Button 
                        variant={calendarView === "week" ? "default" : "outline"} 
                        onClick={() => setCalendarView("week")}
                        size="sm"
                      >
                        Week
                      </Button>
                      <Button 
                        variant={calendarView === "month" ? "default" : "outline"} 
                        onClick={() => setCalendarView("month")}
                        size="sm"
                      >
                        Month
                      </Button>
                      <Button 
                        variant={calendarView === "year" ? "default" : "outline"} 
                        onClick={() => setCalendarView("year")}
                        size="sm"
                      >
                        Year
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaves ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCalendarDate(new Date())}
                            >
                              Today
                            </Button>
                          </div>
                          <h3 className="text-lg font-semibold">
                            {calendarView === "week" && (
                              <>
                                {format(startOfWeek(calendarDate), "MMM d")} - {format(endOfWeek(calendarDate), "MMM d, yyyy")}
                              </>
                            )}
                            {calendarView === "month" && (
                              <>{format(calendarDate, "MMMM yyyy")}</>
                            )}
                            {calendarView === "year" && (
                              <>{format(calendarDate, "yyyy")}</>
                            )}
                          </h3>
                          <div className="invisible w-[70px]">
                            {/* Spacer to maintain flex alignment */}
                          </div>
                        </div>

                        <div className="mt-4 w-full">
                          {calendarView === "week" && (
                            <div className="grid grid-cols-7 gap-2 w-full">
                              {eachDayOfInterval({
                                start: startOfWeek(calendarDate),
                                end: endOfWeek(calendarDate),
                              }).map((day) => {
                                // Find leaves for this day
                                const dayLeaves = employeeLeaves.filter((leave) => {
                                  const startDate = new Date(leave.startDate);
                                  const endDate = new Date(leave.endDate);
                                  return day >= startDate && day <= endDate;
                                });

                                return (
                                  <div
                                    key={day.toISOString()}
                                    className={cn(
                                      "h-[120px] p-2 border rounded-md shadow-sm flex flex-col",
                                      isToday(day) && "bg-accent/50",
                                      dayLeaves.length > 0 && "border-primary",
                                      "transition-all hover:shadow-md"
                                    )}
                                  >
                                    <div className="text-center border-b pb-1 mb-2">
                                      <div className="font-medium text-sm">{format(day, "EEE")}</div>
                                      <div className="text-xl">{format(day, "d")}</div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
                                      {dayLeaves.map((leave) => {
                                        const getStatusStyle = (status: string): string => {
                                          if (status === "Approved") return "bg-green-500 text-white";
                                          if (status === "Rejected") return "bg-red-500 text-white";
                                          return "bg-gray-200 text-gray-700";
                                        };
                                        
                                        return (
                                          <div key={leave.id} className="mb-1">
                                            <div 
                                              className={`w-full rounded-full h-[30px] flex items-center justify-center text-xs px-2 ${getStatusStyle(leave.status)}`}
                                            >
                                              {leave.leaveType?.name || "Leave"}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {calendarView === "month" && (
                            <div className="w-full border rounded-md overflow-hidden shadow-sm">
                              <Calendar
                                mode="multiple"
                                selected={employeeLeaves.flatMap((leave) => {
                                  const startDate = new Date(leave.startDate);
                                  const endDate = new Date(leave.endDate);
                                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                    return [];
                                  }

                                  // Get all dates between start and end
                                  return eachDayOfInterval({
                                    start: startDate,
                                    end: endDate,
                                  });
                                })}
                                month={calendarDate}
                                onMonthChange={setCalendarDate}
                                className="w-full rounded-md p-4"
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4 w-full",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "text-sm font-medium",
                                  nav: "space-x-1 flex items-center",
                                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                  nav_button_previous: "absolute left-1",
                                  nav_button_next: "absolute right-1",
                                  table: "w-full border-collapse space-y-1",
                                  head_row: "flex w-full",
                                  head_cell: "w-full text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
                                  row: "flex w-full mt-2",
                                  cell: "h-10 w-full relative text-center text-sm p-0 rounded-md focus-within:relative focus-within:z-20",
                                  day: "h-10 w-10 p-0 mx-auto hover:bg-accent hover:text-accent-foreground",
                                  day_range_end: "day-range-end",
                                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                  day_today: "bg-accent text-accent-foreground",
                                  day_outside: "opacity-50",
                                  day_disabled: "text-muted-foreground opacity-50",
                                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                  day_hidden: "invisible",
                                }}
                                components={{
                                  DayContent: (props) => {
                                    const date = props.date;
                                    const dayLeaves = employeeLeaves.filter((leave) => {
                                      const startDate = new Date(leave.startDate);
                                      const endDate = new Date(leave.endDate);
                                      return date >= startDate && date <= endDate;
                                    });

                                    const showDayOfMonth = isSameMonth(date, calendarDate);
                                    
                                    // Determine color based on leave status
                                    let bgColor = "";
                                    let textColor = "";
                                    
                                    if (dayLeaves.length > 0 && showDayOfMonth) {
                                      // Check if any approved leaves
                                      const hasApproved = dayLeaves.some(leave => leave.status === "Approved");
                                      // Check if any rejected leaves
                                      const hasRejected = dayLeaves.some(leave => leave.status === "Rejected");
                                      
                                      if (hasApproved) {
                                        bgColor = "bg-green-500";
                                        textColor = "text-white";
                                      } else if (hasRejected) {
                                        bgColor = "bg-red-500";
                                        textColor = "text-white";
                                      } else {
                                        bgColor = "bg-gray-200";
                                        textColor = "text-gray-700";
                                      }
                                    }

                                    return (
                                      <div className="relative h-10 w-10 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center">
                                        <div
                                          className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-md",
                                            dayLeaves.length > 0 && showDayOfMonth && bgColor,
                                            dayLeaves.length > 0 && showDayOfMonth && textColor
                                          )}
                                        >
                                          {showDayOfMonth ? date.getDate() : null}
                                        </div>
                                        {dayLeaves.length > 0 && showDayOfMonth && (
                                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  },
                                }}
                              />
                            </div>
                          )}

                          {calendarView === "year" && (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 w-full">
                              {Array.from({ length: 12 }).map((_, index) => {
                                const month = new Date(calendarDate.getFullYear(), index, 1);
                                const monthName = format(month, "MMM");
                                
                                // Count leaves in this month
                                const monthLeaves = employeeLeaves.filter((leave) => {
                                  const startDate = new Date(leave.startDate);
                                  const endDate = new Date(leave.endDate);
                                  
                                  // Check if leave period overlaps with this month
                                  return (
                                    (startDate.getMonth() === index && startDate.getFullYear() === calendarDate.getFullYear()) || 
                                    (endDate.getMonth() === index && endDate.getFullYear() === calendarDate.getFullYear()) ||
                                    (startDate.getMonth() <= index && endDate.getMonth() >= index && 
                                     startDate.getFullYear() <= calendarDate.getFullYear() && 
                                     endDate.getFullYear() >= calendarDate.getFullYear())
                                  );
                                });
                                
                                const isCurrentMonth = new Date().getMonth() === index && 
                                                      new Date().getFullYear() === calendarDate.getFullYear();
                                
                                // Determine color based on leave status
                                let bgColor = "";
                                let textColor = "";
                                
                                if (monthLeaves.length > 0) {
                                  // Check if any approved leaves
                                  const hasApproved = monthLeaves.some(leave => leave.status === "Approved");
                                  // Check if any rejected leaves
                                  const hasRejected = monthLeaves.some(leave => leave.status === "Rejected");
                                  
                                  if (hasApproved) {
                                    bgColor = "bg-green-100 border-green-500";
                                    textColor = "text-green-800";
                                  } else if (hasRejected) {
                                    bgColor = "bg-red-100 border-red-500";
                                    textColor = "text-red-800";
                                  } else {
                                    bgColor = "bg-gray-100 border-gray-400";
                                    textColor = "text-gray-800";
                                  }
                                }
                                
                                return (
                                  <div 
                                    key={index}
                                    className={cn(
                                      "aspect-square p-3 border rounded-md text-center cursor-pointer hover:shadow-md transition-all shadow-sm flex flex-col justify-between",
                                      isCurrentMonth && !bgColor && "bg-accent/50",
                                      bgColor,
                                      textColor
                                    )}
                                    onClick={() => {
                                      const newDate = new Date(calendarDate);
                                      newDate.setMonth(index);
                                      setCalendarDate(newDate);
                                      setCalendarView("month");
                                    }}
                                  >
                                    <div className="font-medium text-lg">{monthName}</div>
                                    {monthLeaves.length > 0 ? (
                                      <div className="mt-auto mx-auto rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm">
                                        {monthLeaves.length} {monthLeaves.length === 1 ? "leave" : "leaves"}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground mt-auto">No leaves</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {employeeLeaves.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Recent Leave Requests</h3>
                            <div className="space-y-3">
                              {employeeLeaves.slice(0, 5).map((leave) => (
                                <div 
                                  key={leave.id} 
                                  className="p-3 border rounded-md shadow-sm"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-medium">{leave.leaveType?.name || "Leave"}</span>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {format(new Date(leave.startDate), "PP")} - {format(new Date(leave.endDate), "PP")}
                                      </div>
                                      {leave.reason && (
                                        <div className="mt-1 text-sm">
                                          {leave.reason}
                                        </div>
                                      )}
                                    </div>
                                    <div 
                                      className={`rounded-full h-[30px] px-4 flex items-center justify-center text-sm font-medium
                                        ${leave.status === "Approved" 
                                          ? "bg-green-500 text-white" 
                                          : leave.status === "Rejected" 
                                          ? "bg-red-500 text-white" 
                                          : "bg-gray-200 text-gray-700"}`
                                      }
                                    >
                                      {leave.status}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {employeeLeaves.length === 0 && (
                          <div className="py-8 text-center text-muted-foreground">
                            No leave records found for this employee
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}