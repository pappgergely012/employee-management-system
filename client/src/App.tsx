import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import AddEditEmployee from "@/pages/employees/add-edit";
import Attendance from "@/pages/attendance";
import LeaveManagement from "@/pages/leave-management";
import Salary from "@/pages/salary";
import Reports from "@/pages/reports";
import Departments from "@/pages/configuration/departments";
import Designations from "@/pages/configuration/designations";
import EmployeeTypes from "@/pages/configuration/employee-types";
import Shifts from "@/pages/configuration/shifts";
import LeaveTypes from "@/pages/configuration/leave-types";
import Locations from "@/pages/configuration/locations";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      
      <ProtectedRoute path="/employees" component={Employees} />
      <ProtectedRoute path="/employees/add" component={AddEditEmployee} />
      <ProtectedRoute path="/employees/edit/:id" component={AddEditEmployee} />
      
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/leave-management" component={LeaveManagement} />
      <ProtectedRoute path="/salary" component={Salary} />
      <ProtectedRoute path="/reports" component={Reports} />
      
      <ProtectedRoute path="/configuration/departments" component={Departments} />
      <ProtectedRoute path="/configuration/designations" component={Designations} />
      <ProtectedRoute path="/configuration/employee-types" component={EmployeeTypes} />
      <ProtectedRoute path="/configuration/shifts" component={Shifts} />
      <ProtectedRoute path="/configuration/leave-types" component={LeaveTypes} />
      <ProtectedRoute path="/configuration/locations" component={Locations} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout>
          <Router />
        </AppLayout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
