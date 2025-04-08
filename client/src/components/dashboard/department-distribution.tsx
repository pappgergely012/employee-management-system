import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type DepartmentDistribution = {
  departmentId: number;
  name: string;
  count: number;
  percentage: number;
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#94a3b8", "#EC4899", "#8B5CF6"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        className="px-3 py-2 rounded-md shadow-sm"
        style={{ 
          color: payload[0].color,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${payload[0].color}`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <p className="font-medium">{data.name}</p>
        <p className="text-sm">{data.value} employees ({data.percentage}%)</p>
      </div>
    );
  }
  return null;
};

export default function DepartmentDistribution() {
  const { data, isLoading, error } = useQuery<DepartmentDistribution[]>({
    queryKey: ['/api/dashboard/department-distribution'],
  });

  console.log('Department Distribution Data:', data);
  console.log('Is Loading:', isLoading);
  console.log('Error:', error);

  const totalEmployees = data?.reduce((sum, dept) => sum + Number(dept.count), 0) || 0;

  // Transform data for the chart
  const chartData = data?.map(dept => ({
    name: dept.name,
    value: Number(dept.count),
    percentage: dept.percentage
  })) || [];

  console.log('Chart Data:', chartData);

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
              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <div className="w-[250px] h-[250px] relative">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={<CustomTooltip />}
                          position={{ x: 0, y: 0 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No data available</p>
                    </div>
                  )}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-2xl font-bold text-gray-800">{totalEmployees}</div>
                    <div className="text-xs text-gray-500">Total Employees</div>
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
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
