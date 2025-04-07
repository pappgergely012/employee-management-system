import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Employee = {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;
  designationId: number;
  dateOfJoining: string;
  avatar: string;
  departmentName: string;
  designationName: string;
};

export default function RecentEmployees() {
  const { data, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['/api/dashboard/recent-employees'],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Recent Employees</CardTitle>
        <Link href="/employees">
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(3)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-4 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
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
          <p>Failed to load recent employees</p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data && data.length > 0 ? (
                  data.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            {employee.avatar && <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />}
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {getInitials(employee.firstName, employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.departmentName}</div>
                        <div className="text-sm text-gray-500">{employee.designationName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.dateOfJoining, 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No recent employees found
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
