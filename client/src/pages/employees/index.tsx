import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, FileEdit, Trash2, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Employee, Department, Designation } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Employees() {
  const [, setLocation] = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      console.error('Employees query error:', error);
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }
  }, [error]);

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: designations } = useQuery<Designation[]>({
    queryKey: ['/api/designations'],
  });

  if (error) {
    console.error('Error fetching employees:', error);
    return (
      <Layout title="Employees">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-destructive mb-4">Error loading employees</div>
          <div className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/employees'] })}>
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await apiRequest("DELETE", `/api/employees/${selectedEmployee.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee deleted",
        description: "The employee has been deleted successfully",
      });
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getDepartmentName = (departmentId: number) => {
    return departments?.find((dept: Department) => dept.id === departmentId)?.name || "Unknown";
  };

  const getDesignationName = (designationId: number) => {
    return designations?.find((desig: Designation) => desig.id === designationId)?.name || "Unknown";
  };

  const columns = [
    {
      header: "Employee",
      accessorKey: "firstName" as keyof Employee,
      cell: (employee: Employee) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            {employee.avatar && <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />}
            <AvatarFallback className="bg-gray-200 text-gray-700">
              {getInitials(employee.firstName, employee.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
            <div className="text-sm text-gray-500">{employee.email}</div>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      header: "Employee ID",
      accessorKey: "employeeId" as keyof Employee,
      cell: (employee: Employee) => <div className="text-sm">{employee.employeeId}</div>,
      searchable: true,
    },
    {
      header: "Department",
      accessorKey: "departmentId" as keyof Employee,
      cell: (employee: Employee) => <div className="text-sm">{getDepartmentName(employee.departmentId)}</div>,
      searchable: false,
    },
    {
      header: "Designation",
      accessorKey: "designationId" as keyof Employee,
      cell: (employee: Employee) => <div className="text-sm">{getDesignationName(employee.designationId)}</div>,
      searchable: false,
    },
    {
      header: "Joining Date",
      accessorKey: "dateOfJoining" as keyof Employee,
      cell: (employee: Employee) => <div className="text-sm">{formatDate(employee.dateOfJoining, "PP")}</div>,
      searchable: false,
    },
    {
      header: "Status",
      accessorKey: "isActive" as keyof Employee,
      cell: (employee: Employee) => (
        <Badge variant={employee.isActive ? "default" : "destructive"}>
          {employee.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      searchable: false,
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Employee,
      cell: (employee: Employee) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/employees/edit/${employee.id}`);
            }}
          >
            <FileEdit className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEmployee(employee);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <Layout title="Employees">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Employee Management</h1>
        <Link href="/employees/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={employees || []}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        exportable={true}
        fileName="employees"
        onRowClick={(employee) => setLocation(`/employees/edit/${employee.id}`)}
        emptyState={
          <div className="text-center py-10">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium mb-2">No employees found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first employee.</p>
            <Link href="/employees/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
        }
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              {selectedEmployee && ` ${selectedEmployee.firstName} ${selectedEmployee.lastName}`} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
