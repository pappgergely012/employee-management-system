import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import Layout from "@/components/layout/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { insertEmployeeSchema, Employee } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDate, generateEmployeeId } from "@/lib/utils";

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

export default function AddEditEmployee() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditMode = Boolean(params.id);
  const [activeTab, setActiveTab] = useState("personal");

  // Get employee data if in edit mode
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: ['/api/employees', Number(params.id)],
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

  // Filter designations based on selected department
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const filteredDesignations = designations.filter(
    (designation) => designation.departmentId === selectedDepartmentId
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

  // Update default values when employee data is loaded
  useEffect(() => {
    if (employee) {
      // Safely format dates to prevent Invalid time value errors
      let dateOfJoining = "";
      let dateOfBirth = "";
      
      try {
        // Handle dateOfJoining - this is required so should always exist
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
      } catch (error) {
        console.error("Error formatting dates:", error);
      }

      form.reset({
        ...employee,
        dateOfJoining,
        dateOfBirth,
      });

      setSelectedDepartmentId(employee.departmentId);
    }
  }, [employee, form]);

  // Generate employee ID for new employees
  useEffect(() => {
    if (!isEditMode && departments && departments.length > 0) {
      const selectedDept = departments.find((dept) => dept.id === selectedDepartmentId);
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
      // Ensure date values are properly formatted or set to null/empty if invalid
      dateOfJoining: data.dateOfJoining || new Date().toISOString().split('T')[0],
      dateOfBirth: data.dateOfBirth || null
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment Details</TabsTrigger>
          <TabsTrigger value="address">Address & Contact</TabsTrigger>
        </TabsList>

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
                              {departments.map((department) => (
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
                              {filteredDesignations.map((designation) => (
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
                              {employeeTypes.map((type) => (
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
                              {shifts.map((shift) => (
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
                              {locations.map((location) => (
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
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP/Postal Code" {...field} />
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
      </Tabs>
    </Layout>
  );
}
