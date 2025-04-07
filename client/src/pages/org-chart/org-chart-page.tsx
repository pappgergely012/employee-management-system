import { Layout } from "@/components/layout/layout";
import { OrgChart } from "./org-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { OrgChartNode } from "@shared/schema";
import { useState } from "react";
import { AddNodeDialog } from "./add-node-dialog";
import { EditNodeDialog } from "./edit-node-dialog";
import { useToast } from "@/hooks/use-toast";

export default function OrgChartPage() {
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [editNodeOpen, setEditNodeOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<OrgChartNode | null>(null);
  const { toast } = useToast();

  const { data: chartNodes = [], isLoading, refetch } = useQuery<OrgChartNode[]>({
    queryKey: ["/api/org-chart"],
  });

  const handleNodeClick = (node: OrgChartNode) => {
    setSelectedNode(node);
    setEditNodeOpen(true);
  };

  const handleUpdateSuccess = () => {
    toast({
      title: "Success",
      description: "Organization chart updated successfully",
    });
    refetch();
  };

  return (
    <Layout>
      <div className="container py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Organization Chart</CardTitle>
              <CardDescription>
                View and manage your company's organizational structure
              </CardDescription>
            </div>
            <Button onClick={() => setAddNodeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Node
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : chartNodes.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium mb-2">No organization chart data yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding the root node of your organization
                </p>
                <Button onClick={() => setAddNodeOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Root Node
                </Button>
              </div>
            ) : (
              <div className="org-chart-container overflow-auto max-h-[600px] p-4">
                <OrgChart
                  nodes={chartNodes}
                  onNodeClick={handleNodeClick}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddNodeDialog
        open={addNodeOpen}
        onOpenChange={setAddNodeOpen}
        onSuccess={handleUpdateSuccess}
        parentNode={selectedNode}
      />

      {selectedNode && (
        <EditNodeDialog
          open={editNodeOpen}
          onOpenChange={setEditNodeOpen}
          node={selectedNode}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </Layout>
  );
}