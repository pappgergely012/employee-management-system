import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Download,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  exportable?: boolean;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  fileName?: string; // For export
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  pagination = true,
  exportable = true,
  onRowClick,
  emptyState,
  fileName = "export",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof T>>(
    new Set(columns.map((col) => col.accessorKey))
  );

  // Handle sorting
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.accessorKey;
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Handle column visibility toggle
  const toggleColumnVisibility = (key: keyof T) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(key)) {
      newVisibleColumns.delete(key);
    } else {
      newVisibleColumns.add(key);
    }
    setVisibleColumns(newVisibleColumns);
  };

  // Filter data based on search term
  const filteredData = searchTerm && data
    ? data.filter((item) =>
        columns
          .filter(col => col.searchable !== false)
          .some((column) => {
            const value = item[column.accessorKey];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
          })
      )
    : data;

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = String(aValue).localeCompare(String(bValue));
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : filteredData;

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  // Export to Excel
  const handleExport = () => {
    const visibleColumnsArray = Array.from(visibleColumns);
    const visibleData = sortedData.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((column) => {
        if (visibleColumnsArray.includes(column.accessorKey)) {
          const value = item[column.accessorKey];
          row[column.header] = value;
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(visibleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <Skeleton className="h-10 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="p-4 flex justify-between items-center border-t">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        )}
      </Card>
    );
  }

  // Empty state
  if (data.length === 0 || pageData.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 max-w-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button size="sm" variant="outline" onClick={handleExport} disabled={data.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div key={String(column.accessorKey)} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${String(column.accessorKey)}`}
                        checked={visibleColumns.has(column.accessorKey)}
                        onCheckedChange={() =>
                          toggleColumnVisibility(column.accessorKey)
                        }
                      />
                      <Label htmlFor={`column-${String(column.accessorKey)}`}>
                        {column.header}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          {emptyState || (
            <div className="text-muted-foreground">
              <div className="text-xl mb-2">No data found</div>
              <p>There are no items to display.</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        {searchable && (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 max-w-xs"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        <div className="flex items-center space-x-2">
          {exportable && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={String(column.accessorKey)} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${String(column.accessorKey)}`}
                      checked={visibleColumns.has(column.accessorKey)}
                      onCheckedChange={() =>
                        toggleColumnVisibility(column.accessorKey)
                      }
                    />
                    <Label htmlFor={`column-${String(column.accessorKey)}`}>
                      {column.header}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(
                (column, i) =>
                  visibleColumns.has(column.accessorKey) && (
                    <TableHead
                      key={i}
                      className={column.sortable ? "cursor-pointer" : ""}
                      onClick={() => column.sortable && handleSort(column)}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {sortColumn === column.accessorKey && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((item, i) => (
              <TableRow
                key={i}
                className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map(
                  (column, j) =>
                    visibleColumns.has(column.accessorKey) && (
                      <TableCell key={j}>
                        {column.cell
                          ? column.cell(item)
                          : (item[column.accessorKey] as React.ReactNode)}
                      </TableCell>
                    )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && totalPages > 1 && (
        <div className="p-4 flex justify-between items-center border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
