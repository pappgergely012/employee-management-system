import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function EmployeeTypes() {
  return (
    <Layout title="Employee Types">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Employee Types Configuration</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Types Management</CardTitle>
          <CardDescription>
            Create and manage different employee types in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The employee types configuration module is currently under development. Check back soon for the ability to add, edit, and manage employee types such as full-time, part-time, contract, etc.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Layout>
  );
}