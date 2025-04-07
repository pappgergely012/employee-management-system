import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Departments() {
  return (
    <Layout title="Departments">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Departments Configuration</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Departments Management</CardTitle>
          <CardDescription>
            Create and manage departments in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The departments configuration module is currently under development. Check back soon for the ability to add, edit, and manage departments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Layout>
  );
}