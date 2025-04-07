import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Reports() {
  return (
    <Layout title="Reports">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Reports</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reports Dashboard</CardTitle>
          <CardDescription>
            Access and generate various reports for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The reports module is currently under development. Check back soon for comprehensive employee reports, attendance analytics, leave statistics, and salary summaries.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Layout>
  );
}