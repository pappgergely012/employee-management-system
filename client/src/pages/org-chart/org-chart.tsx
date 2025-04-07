import { OrgChartNode } from "@shared/schema";
import { Tree, TreeNode } from "react-organizational-chart";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrgChartProps {
  nodes: OrgChartNode[];
  onNodeClick?: (node: OrgChartNode) => void;
}

export function OrgChart({ nodes, onNodeClick }: OrgChartProps) {
  // Find root nodes (nodes with parentId === null)
  const rootNodes = nodes.filter((node) => node.parentId === null);

  // Function to recursively build the tree structure
  const buildTree = (parentNode: OrgChartNode) => {
    const children = nodes.filter((node) => node.parentId === parentNode.id);
    
    // Sort children by order
    children.sort((a, b) => a.order - b.order);
    
    return (
      <TreeNode 
        key={parentNode.id} 
        label={
          <NodeCard 
            node={parentNode} 
            onClick={() => onNodeClick?.(parentNode)}
          />
        }
      >
        {children.map((child) => buildTree(child))}
      </TreeNode>
    );
  };

  if (rootNodes.length === 0) {
    return <div className="text-center py-8">No organization chart data available</div>;
  }

  // Sort root nodes by order
  rootNodes.sort((a, b) => a.order - b.order);

  return (
    <div className="org-chart">
      <Tree 
        lineWidth="2px"
        lineColor="#d1d5db"
        lineBorderRadius="10px"
        label={<div className="p-4"></div>}
      >
        {rootNodes.map((rootNode) => buildTree(rootNode))}
      </Tree>
    </div>
  );
}

interface NodeCardProps {
  node: OrgChartNode;
  onClick?: () => void;
}

function NodeCard({ node, onClick }: NodeCardProps) {
  return (
    <Card 
      className={cn(
        "min-w-[200px] max-w-[250px] cursor-pointer hover:shadow-md transition-shadow",
        node.level === 0 && "border-primary/50 bg-primary/5",
        node.level === 1 && "border-secondary/50 bg-secondary/5",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="text-center">
          <h4 className="font-semibold truncate">{node.name}</h4>
          <p className="text-sm text-muted-foreground truncate">{node.title}</p>
        </div>
      </CardContent>
    </Card>
  );
}