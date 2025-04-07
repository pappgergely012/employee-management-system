import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

type DepartmentDistribution = {
  departmentId: number;
  name: string;
  count: number;
  percentage: number;
};

export default function DepartmentDistribution() {
  const { data, isLoading, error } = useQuery<DepartmentDistribution[]>({
    queryKey: ['/api/dashboard/department-distribution'],
  });

  const calculateDonutSegments = (distributions: DepartmentDistribution[]) => {
    let totalDegrees = 0;
    const segments: { department: DepartmentDistribution; offset: number; length: number }[] = [];

    distributions.forEach((department) => {
      const degrees = (department.percentage / 100) * 360;
      segments.push({
        department,
        offset: totalDegrees,
        length: degrees,
      });
      totalDegrees += degrees;
    });

    return segments;
  };

  const getSegmentStyle = (offset: number, length: number) => {
    return {
      strokeDasharray: `${length} 360`,
      strokeDashoffset: -offset,
    };
  };

  const getDepartmentColor = (index: number) => {
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#94a3b8"];
    return colors[index % colors.length];
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h2>
      <Card>
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold">Employee Distribution by Department</CardTitle>
        </CardHeader>

        {isLoading ? (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center">
                <Skeleton className="w-48 h-48 rounded-full" />
              </div>
              <div className="col-span-2">
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 rounded-full mr-3" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-10 mr-2" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="p-6 text-center text-error">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
            <p>Failed to load department distribution</p>
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Donut Chart */}
              <div className="flex items-center justify-center">
                <div className="w-48 h-48 relative">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          {data?.reduce((sum, dept) => sum + dept.count, 0) || 0}
                        </div>
                        <div className="text-xs text-gray-500">Total Employees</div>
                      </div>
                    </div>
                    <svg width="192" height="192" viewBox="0 0 192 192" className="absolute top-0 left-0">
                      <circle cx="96" cy="96" r="80" fill="none" stroke="#ddd" strokeWidth="24" />
                      
                      {data && calculateDonutSegments(data).map((segment, index) => (
                        <circle 
                          key={segment.department.departmentId}
                          cx="96" 
                          cy="96" 
                          r="80" 
                          fill="none" 
                          stroke={getDepartmentColor(index)} 
                          strokeWidth="24" 
                          style={getSegmentStyle(segment.offset, segment.length)}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Departments List */}
              <div className="col-span-2">
                <ul className="space-y-3">
                  {data?.map((department, index) => (
                    <li key={department.departmentId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span 
                          className="h-4 w-4 rounded-full mr-3" 
                          style={{ backgroundColor: getDepartmentColor(index) }}
                        ></span>
                        <span className="text-sm font-medium">{department.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold mr-2">{department.count}</span>
                        <span className="text-xs text-gray-500">{department.percentage}%</span>
                      </div>
                    </li>
                  ))}
                  
                  {data && data.length === 0 && (
                    <li className="text-center text-gray-500 py-4">
                      No departments data available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
