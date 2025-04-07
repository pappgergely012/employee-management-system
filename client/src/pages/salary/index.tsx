import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CalendarIcon, Download, FileDown, Loader2, Plus, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Salary = {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  basicSalary: number;
  houseRentAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  providentFund: number;
  incomeTax: number;
  professionalTax: number;
  otherDeductions: number;
  netSalary: number;
  paymentDate: string;
  paymentStatus: string;
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

const months = [
  { value: 1, name: "January" },
  { value: 2, name: "February" },
  { value: 3, name: "March" },
  { value: 4, name: "April" },
  { value: 5, name: "May" },
  { value: 6, name: "June" },
  { value: 7, name: "July" },
  { value: 8, name: "August" },
  { value: 9, name: "September" },
  { value: 10, name: "October" },
  { value: 11, name: "November" },
  { value: 12, name: "December" },
];

const salaryFormSchema = z.object({
  employeeId: z.coerce.number({
    required_error: "Please select an employee",
  }),
  month: z.coerce.number({
    required_error: "Please select a month",
  }),
  year: z.coerce.number({
    required_error: "Please select a year",
  }),
  basicSalary: z.coerce.number().min(0, "Basic salary must be a positive number"),
  houseRentAllowance: z.coerce.number().min(0, "HRA must be a positive number").optional().default(0),
  conveyanceAllowance: z.coerce.number().min(0, "Conveyance allowance must be a positive number").optional().default(0),
  medicalAllowance: z.coerce.number().min(0, "Medical allowance must be a positive number").optional().default(0),
  specialAllowance: z.coerce.number().min(0, "Special allowance must be a positive number").optional().default(0),
  providentFund: z.coerce.number().min(0, "Provident fund must be a positive number").optional().default(0),
  incomeTax: z.coerce.number().min(0, "Income tax must be a positive number").optional().default(0),
  professionalTax: z.coerce.number().min(0, "Professional tax must be a positive number").optional().default(0),
  otherDeductions: z.coerce.number().min(0, "Other deductions must be a positive number").optional().default(0),
  netSalary: z.coerce.number().min(0, "Net salary must be a positive number"),
  paymentDate: z.date().optional(),
  paymentStatus: z.string().default("pending"),
  remarks: z.string().optional(),
});

export default function SalaryPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [updateMode, setUpdateMode] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [payslipData, setPayslipData] = useState<Salary | null>(null);

  // Get salary data
  const { 
    data: salaries, 
    isLoading: isLoadingSalaries,
    refetch: refetchSalaries 
  } = useQuery<Salary[]>({
    queryKey: ['/api/salaries', { month: selectedMonth, year: selectedYear }],
  });

  // Get all employees for the form
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<z.infer<typeof salaryFormSchema>>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      employeeId: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      houseRentAllowance: 0,
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      providentFund: 0,
      incomeTax: 0,
      professionalTax: 0,
      otherDeductions: 0,
      netSalary: 0,
      paymentStatus: "pending",
      remarks: "",
    },
  });

  // Calculate net salary whenever any salary component changes
  const watchAllFields = form.watch();
  const calculateNetSalary = () => {
    const {
      basicSalary = 0,
      houseRentAllowance = 0,
      conveyanceAllowance = 0,
      medicalAllowance = 0,
      specialAllowance = 0,
      providentFund = 0,
      incomeTax = 0,
      professionalTax = 0,
      otherDeductions = 0,
    } = watchAllFields;

    const grossSalary = 
      Number(basicSalary) + 
      Number(houseRentAllowance) + 
      Number(conveyanceAllowance) + 
      Number(medicalAllowance) + 
      Number(specialAllowance);

    const totalDeductions = 
      Number(providentFund) + 
      Number(incomeTax) + 
      Number(professionalTax) + 
      Number(otherDeductions);

    const netSalary = grossSalary - totalDeductions;
    
    form.setValue("netSalary", netSalary);
    return netSalary;
  };

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      employeeId: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      houseRentAllowance: 0,
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      providentFund: 0,
      incomeTax: 0,
      professionalTax: 0,
      otherDeductions: 0,
      netSalary: 0,
      paymentStatus: "pending",
      remarks: "",
    });
    setUpdateMode(false);
    setSelectedSalary(null);
  };

  // Set form values when editing salary
  const setFormForEdit = (salary: Salary) => {
    const paymentDate = salary.paymentDate ? new Date(salary.paymentDate) : undefined;
    
    form.reset({
      employeeId: salary.employeeId,
      month: salary.month,
      year: salary.year,
      basicSalary: salary.basicSalary,
      houseRentAllowance: salary.houseRentAllowance || 0,
      conveyanceAllowance: salary.conveyanceAllowance || 0,
      medicalAllowance: salary.medicalAllowance || 0,
      specialAllowance: salary.specialAllowance || 0,
      providentFund: salary.providentFund || 0,
      incomeTax: salary.incomeTax || 0,
      professionalTax: salary.professionalTax || 0,
      otherDeductions: salary.otherDeductions || 0,
      netSalary: salary.netSalary,
      paymentDate,
      paymentStatus: salary.paymentStatus,
      remarks: salary.remarks || "",
    });
    
    setUpdateMode(true);
    setSelectedSalary(salary);
    setOpenDialog(true);
  };

  // Create salary mutation
  const createSalaryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof salaryFormSchema>) => {
      // Format the payment date correctly for the API
      const formattedData = {
        ...data,
        paymentDate: data.paymentDate ? format(data.paymentDate, "yyyy-MM-dd") : null,
      };

      const res = await apiRequest("POST", "/api/salaries", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Salary created",
        description: "Salary has been created successfully",
      });
      refetchSalaries();
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create salary",
        variant: "destructive",
      });
    },
  });

  // Update salary mutation
  const updateSalaryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof salaryFormSchema>) => {
      if (!selectedSalary) return null;

      // Format the payment date correctly for the API
      const formattedData = {
        ...data,
        paymentDate: data.paymentDate ? format(data.paymentDate, "yyyy-MM-dd") : null,
      };

      const res = await apiRequest("PUT", `/api/salaries/${selectedSalary.id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Salary updated",
        description: "Salary has been updated successfully",
      });
      refetchSalaries();
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update salary",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof salaryFormSchema>) => {
    // Ensure net salary calculation is accurate
    calculateNetSalary();
    
    if (updateMode) {
      updateSalaryMutation.mutate(data);
    } else {
      // Check if salary for this employee, month, and year already exists
      const existingSalary = salaries?.find(
        s => s.employeeId === data.employeeId && s.month === data.month && s.year === data.year
      );
      
      if (existingSalary) {
        toast({
          title: "Salary already exists",
          description: "A salary record already exists for this employee for the selected month and year",
          variant: "destructive",
        });
        return;
      }
      
      createSalaryMutation.mutate(data);
    }
  };

  // Show payslip for a specific salary record
  const handleViewPayslip = (salary: Salary) => {
    setPayslipData(salary);
    setShowPayslip(true);
  };

  const columns = [
    {
      header: "Employee",
      accessorKey: "employeeId",
      cell: (salary: Salary) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            {salary.employeeAvatar && <AvatarImage src={salary.employeeAvatar} alt={salary.employeeName} />}
            <AvatarFallback>
              {salary.employeeName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{salary.employeeName}</div>
            <div className="text-sm text-muted-foreground">{salary.department}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Period",
      accessorKey: "month",
      cell: (salary: Salary) => (
        <div>{months.find(m => m.value === salary.month)?.name} {salary.year}</div>
      ),
    },
    {
      header: "Basic Salary",
      accessorKey: "basicSalary",
      cell: (salary: Salary) => formatCurrency(salary.basicSalary),
    },
    {
      header: "Allowances",
      accessorKey: "houseRentAllowance",
      cell: (salary: Salary) => 
        formatCurrency(
          (salary.houseRentAllowance || 0) + 
          (salary.conveyanceAllowance || 0) + 
          (salary.medicalAllowance || 0) + 
          (salary.specialAllowance || 0)
        ),
    },
    {
      header: "Deductions",
      accessorKey: "providentFund",
      cell: (salary: Salary) => 
        formatCurrency(
          (salary.providentFund || 0) + 
          (salary.incomeTax || 0) + 
          (salary.professionalTax || 0) + 
          (salary.otherDeductions || 0)
        ),
    },
    {
      header: "Net Salary",
      accessorKey: "netSalary",
      cell: (salary: Salary) => (
        <div className="font-medium">{formatCurrency(salary.netSalary)}</div>
      ),
    },
    {
      header: "Status",
      accessorKey: "paymentStatus",
      cell: (salary: Salary) => (
        <Badge 
          variant="outline" 
          className={
            salary.paymentStatus === "paid" 
              ? "bg-green-100 text-green-800 border-green-200" 
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          }
        >
          {salary.paymentStatus.charAt(0).toUpperCase() + salary.paymentStatus.slice(1)}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (salary: Salary) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setFormForEdit(salary);
            }}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleViewPayslip(salary);
            }}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Payslip
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Salary Management">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Salary Management</h1>
        
        <div className="flex space-x-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetchSalaries()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>

          <Dialog open={openDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setOpenDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Salary
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{updateMode ? "Update Salary" : "Add Salary"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
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
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value.toString()}
                            value={field.value.toString()}
                            disabled={updateMode}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.name}
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
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value.toString()}
                            value={field.value.toString()}
                            disabled={updateMode}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
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
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
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
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Earnings</h3>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="basicSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Basic Salary</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="houseRentAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>House Rent Allowance</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="conveyanceAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conveyance Allowance</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medicalAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medical Allowance</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="specialAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Allowance</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Deductions</h3>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="providentFund"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provident Fund</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="incomeTax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Income Tax</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="professionalTax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Tax</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="otherDeductions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Deductions</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateNetSalary();
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="netSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Net Salary</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field}
                                  readOnly
                                  className="font-medium text-primary"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payment Date</FormLabel>
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
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createSalaryMutation.isPending || updateSalaryMutation.isPending}
                    >
                      {(createSalaryMutation.isPending || updateSalaryMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {updateMode ? "Update" : "Add"} Salary
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="salaries">
        <TabsList className="mb-6">
          <TabsTrigger value="salaries">Salary Records</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="salaries">
          <DataTable
            columns={columns}
            data={salaries || []}
            isLoading={isLoadingSalaries}
            pagination={true}
            exportable={true}
            fileName={`salaries-${months.find(m => m.value === selectedMonth)?.name.toLowerCase()}-${selectedYear}`}
            emptyState={
              <div className="text-center py-10">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-medium mb-2">No salary records found</h3>
                <p className="text-muted-foreground mb-4">
                  No salary records for {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Salary
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Salary Disbursement</CardTitle>
                <CardDescription>
                  {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(
                    salaries?.reduce((total, salary) => total + salary.netSalary, 0) || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total for {salaries?.length || 0} employees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>
                  {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">Paid</div>
                      <div className="text-xl font-semibold text-green-600">
                        {salaries?.filter(s => s.paymentStatus === "paid").length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Pending</div>
                      <div className="text-xl font-semibold text-yellow-600">
                        {salaries?.filter(s => s.paymentStatus === "pending").length || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${salaries?.length ? 
                          Math.round((salaries.filter(s => s.paymentStatus === "paid").length / salaries.length) * 100) : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Wise</CardTitle>
                <CardDescription>
                  Salary distribution by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salaries && salaries.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      // Group salaries by department
                      const departmentData: Record<string, { count: number; total: number }> = {};
                      
                      salaries.forEach(salary => {
                        const dept = salary.department;
                        if (!departmentData[dept]) {
                          departmentData[dept] = { count: 0, total: 0 };
                        }
                        departmentData[dept].count += 1;
                        departmentData[dept].total += salary.netSalary;
                      });
                      
                      return Object.entries(departmentData).map(([dept, data]) => (
                        <div key={dept} className="flex justify-between">
                          <div>
                            <div className="text-sm font-medium">{dept}</div>
                            <div className="text-xs text-muted-foreground">
                              {data.count} {data.count === 1 ? "employee" : "employees"}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">{formatCurrency(data.total)}</div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No data available for selected period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payslip Dialog */}
      <Dialog open={showPayslip} onOpenChange={setShowPayslip}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
          </DialogHeader>
          
          {payslipData && (
            <div className="p-6 relative">
              <div className="absolute top-0 right-0">
                <Button variant="outline" size="sm" className="mr-4">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Employee Management System</h2>
                <p className="text-sm text-muted-foreground">Payslip for {months.find(m => m.value === payslipData.month)?.name} {payslipData.year}</p>
              </div>
              
              <div className="border-t border-b py-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">Employee Details</h3>
                    <div className="mt-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {payslipData.employeeName}</p>
                      <p className="text-sm"><span className="font-medium">Department:</span> {payslipData.department}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Salary Details</h3>
                    <div className="mt-2">
                      <p className="text-sm"><span className="font-medium">Period:</span> {months.find(m => m.value === payslipData.month)?.name} {payslipData.year}</p>
                      <p className="text-sm"><span className="font-medium">Payment Date:</span> {payslipData.paymentDate ? formatDate(payslipData.paymentDate, "PPP") : "Pending"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Earnings</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Basic Salary</td>
                        <td className="py-2 text-right">{formatCurrency(payslipData.basicSalary)}</td>
                      </tr>
                      {payslipData.houseRentAllowance > 0 && (
                        <tr className="border-b">
                          <td className="py-2">House Rent Allowance</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.houseRentAllowance)}</td>
                        </tr>
                      )}
                      {payslipData.conveyanceAllowance > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Conveyance Allowance</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.conveyanceAllowance)}</td>
                        </tr>
                      )}
                      {payslipData.medicalAllowance > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Medical Allowance</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.medicalAllowance)}</td>
                        </tr>
                      )}
                      {payslipData.specialAllowance > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Special Allowance</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.specialAllowance)}</td>
                        </tr>
                      )}
                      <tr className="border-b font-semibold">
                        <td className="py-2">Total Earnings</td>
                        <td className="py-2 text-right">
                          {formatCurrency(
                            payslipData.basicSalary +
                            (payslipData.houseRentAllowance || 0) +
                            (payslipData.conveyanceAllowance || 0) +
                            (payslipData.medicalAllowance || 0) +
                            (payslipData.specialAllowance || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-2">Deductions</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {payslipData.providentFund > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Provident Fund</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.providentFund)}</td>
                        </tr>
                      )}
                      {payslipData.incomeTax > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Income Tax</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.incomeTax)}</td>
                        </tr>
                      )}
                      {payslipData.professionalTax > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Professional Tax</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.professionalTax)}</td>
                        </tr>
                      )}
                      {payslipData.otherDeductions > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Other Deductions</td>
                          <td className="py-2 text-right">{formatCurrency(payslipData.otherDeductions)}</td>
                        </tr>
                      )}
                      <tr className="border-b font-semibold">
                        <td className="py-2">Total Deductions</td>
                        <td className="py-2 text-right">
                          {formatCurrency(
                            (payslipData.providentFund || 0) +
                            (payslipData.incomeTax || 0) +
                            (payslipData.professionalTax || 0) +
                            (payslipData.otherDeductions || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-lg">Net Salary</div>
                  <div className="font-bold text-lg text-primary">{formatCurrency(payslipData.netSalary)}</div>
                </div>
                {payslipData.remarks && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <span className="font-medium">Remarks:</span> {payslipData.remarks}
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                <p>This is a computer-generated payslip and does not require a signature.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
