import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Locations() {
  return (
    <Layout title="Locations">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Locations Configuration</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Locations Management</CardTitle>
          <CardDescription>
            Create and manage office locations for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The locations configuration module is currently under development. Check back soon for the ability to add, edit, and manage office locations including address details and contact information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Layout>
  );
}