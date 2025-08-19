"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  Column,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MultiSelect } from "@/components/ui/multi-select"
import { supabase } from "@/lib/supabase"

interface GrantCluster {
  id: string
  grant_name: string
  grant_amount: string | null
  grant_date: string | null
  grant_url: string | null
  grant_description: string | null
  grant_organisation: string | null
  grant_eligibility: string | null
  created_at: string
  raw_grant_count: number
}

interface GrantClustersTableProps {
  data: GrantCluster[]
  loading?: boolean
  totalCount?: number
  pageSize?: number
  pageIndex?: number
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  // Filter props
  hideEmptyAmount?: boolean
  hideEmptyUrl?: boolean
  hideEmptyEligibility?: boolean
  hideEmptyDescription?: boolean
  hideEmptyOrganization?: boolean
  hideEmptyDate?: boolean
  hideSingleGrants?: boolean
  selectedOrganizations?: string[]
  allOrganizations?: string[]
  onSelectedOrganizationsChange?: (selected: string[]) => void
  onFilterChange?: (filterName: string, value: boolean) => void
}

// Helper function to truncate long URLs
const truncateUrl = (url: string | null, maxLength: number = 60): string => {
  if (!url) return "N/A";
  
  if (url.length <= maxLength) {
    return url;
  }
  
  // Extract protocol and domain
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol + '//';
    const host = urlObj.host;
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    
    // If the protocol + host is already too long, just truncate the whole thing
    if (protocol.length + host.length >= maxLength - 3) {
      return url.substring(0, maxLength - 3) + '...';
    }
    
    // Truncate the path if needed
    const availableLength = maxLength - protocol.length - host.length - 3; // -3 for '...'
    if (path.length <= availableLength) {
      return url;
    }
    
    return protocol + host + path.substring(0, availableLength) + '...';
  } catch (e) {
    // If URL parsing fails, fall back to simple truncation
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
};

export function GrantClustersTable({ 
  data, 
  loading = false,
  totalCount = 0,
  pageSize = 10,
  pageIndex = 0,
  onPageChange,
  onPageSizeChange,
  hideEmptyAmount,
  hideEmptyUrl,
  hideEmptyEligibility,
  hideEmptyDescription,
  hideEmptyOrganization,
  hideEmptyDate,
  hideSingleGrants,
  selectedOrganizations = [],
  allOrganizations = [],
  onSelectedOrganizationsChange,
  onFilterChange
}: GrantClustersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // State for tracking expanded rows (accordion behavior - only one row expanded at a time)
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null)
  
  // State for storing raw grants data for expanded rows (lazy loading)
  const [expandedRowRawGrants, setExpandedRowRawGrants] = React.useState<Record<string, any[]>>({})
  const [loadingRawGrants, setLoadingRawGrants] = React.useState<Record<string, boolean>>({})

  const columns: ColumnDef<GrantCluster>[] = [
    {
      accessorKey: "grant_name",
      header: "Grant Name",
      cell: ({ row }: { row: Row<GrantCluster> }) => <div className="font-medium truncate">{row.getValue("grant_name")}</div>,
      size: 200,
    },
    {
      accessorKey: "grant_amount",
      header: "Amount",
      cell: ({ row }: { row: Row<GrantCluster> }) => {
        const amount = row.getValue("grant_amount") as string | null
        return <div className="truncate">{amount || "N/A"}</div>
      },
      size: 100,
    },
    {
      accessorKey: "grant_organisation",
      header: "Organization",
      cell: ({ row }: { row: Row<GrantCluster> }) => {
        const org = row.getValue("grant_organisation") as string | null
        return <div className="truncate">{org || "N/A"}</div>
      },
      size: 150,
    },
    {
      accessorKey: "created_at",
      header: ({ column }: { column: Column<GrantCluster> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            {column.getIsSorted() === "asc" ? " ↑" : " ↓"}
          </Button>
        )
      },
      cell: ({ row }: { row: Row<GrantCluster> }) => {
        const date = new Date(row.getValue("created_at"))
        return <div className="truncate">{date.toLocaleDateString()}</div>
      },
      size: 120,
    },
    {
      accessorKey: "raw_grant_count",
      header: "Raw Grants Count",
      cell: ({ row }: { row: Row<GrantCluster> }) => {
        const count = row.getValue("raw_grant_count") as number
        return <div className="font-medium">{count}</div>
      },
      size: 120,
    },
  ]

  // Get unique organizations from the data
  const uniqueOrganizations = React.useMemo(() => {
    const orgs = new Set<string>();
    data.forEach(cluster => {
      if (cluster.grant_organisation) {
        orgs.add(cluster.grant_organisation);
      }
    });
    return Array.from(orgs).sort();
  }, [data]);

  // Filter data based on hideSingleGrants prop only (organization filtering is done server-side)
  const filteredData = React.useMemo(() => {
    if (!hideSingleGrants) return data;
    return data.filter(cluster => cluster.raw_grant_count > 1);
  }, [data, hideSingleGrants]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value)
    if (onPageSizeChange) {
      onPageSizeChange(newSize)
    }
  }

  // Handle page index change
  const handlePageChange = (newPageIndex: number) => {
    if (onPageChange) {
      onPageChange(newPageIndex)
    }
  }

  // Function to fetch raw grants for a specific cluster
  const fetchRawGrantsForCluster = async (clusterId: string) => {
    // If we already have the data or are loading it, don't fetch again
    if (expandedRowRawGrants[clusterId] || loadingRawGrants[clusterId]) {
      return;
    }

    try {
      setLoadingRawGrants(prev => ({ ...prev, [clusterId]: true }));
      
      const { data, error } = await supabase
        .from('raw_grants')
        .select('*')
        .eq('cluster_id', clusterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching raw grants:', error);
        return;
      }

      setExpandedRowRawGrants(prev => ({ ...prev, [clusterId]: data || [] }));
    } catch (err) {
      console.error('Error fetching raw grants:', err);
    } finally {
      setLoadingRawGrants(prev => ({ ...prev, [clusterId]: false }));
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Input
              placeholder="Filter grants..."
              value={(table.getColumn("grant_name")?.getFilterValue() as string) ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                table.getColumn("grant_name")?.setFilterValue(event.target.value)
              }
              className="w-full sm:w-48 md:w-56"
            />
            <MultiSelect
              options={allOrganizations}
              selected={selectedOrganizations}
              onChange={onSelectedOrganizationsChange || (() => {})}
              placeholder="Select organizations..."
              className="w-full sm:w-48 md:w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Hide Empty Fields</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={hideEmptyAmount}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyAmount", checked)}
              >
                Amount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideEmptyUrl}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyUrl", checked)}
              >
                URL
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideEmptyEligibility}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyEligibility", checked)}
              >
                Eligibility
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideEmptyDescription}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyDescription", checked)}
              >
                Description
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideEmptyOrganization}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyOrganization", checked)}
              >
                Organization
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideEmptyDate}
                onCheckedChange={(checked) => onFilterChange?.("hideEmptyDate", checked)}
              >
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Other Filters</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={hideSingleGrants}
                onCheckedChange={(checked) => onFilterChange?.("hideSingleGrants", checked)}
              >
                Single Grants (1 grant)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[80px] sm:w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">per page</span>
        </div>
      </div>
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto' }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column, cellIndex) => (
                    <TableCell 
                      key={`skeleton-cell-${rowIndex}-${cellIndex}`}
                      style={{ width: column.size ? `${column.size}px` : 'auto' }}
                      className="truncate"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      const newExpandedId = expandedRowId === row.original.id ? null : row.original.id;
                      setExpandedRowId(newExpandedId);
                      // Fetch raw grants data immediately when expanding
                      if (newExpandedId) {
                        fetchRawGrantsForCluster(newExpandedId);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        style={{ width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto' }}
                        className="truncate"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRowId === row.original.id && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        <Tabs defaultValue="details" className="w-full" onValueChange={(value) => {
                          if (value !== "details" && value !== "loading") {
                            // This is a raw grant tab, ensure data is loaded
                            fetchRawGrantsForCluster(row.original.id);
                          }
                        }}>
                          <TabsList>
                            <TabsTrigger value="details">Cluster Details</TabsTrigger>
                            {loadingRawGrants[row.original.id] ? (
                              <TabsTrigger value="loading">Loading Grants...</TabsTrigger>
                            ) : expandedRowRawGrants[row.original.id] ? (
                              expandedRowRawGrants[row.original.id].map((rawGrant: any) => (
                                <TabsTrigger key={rawGrant.id} value={rawGrant.id}>
                                  {rawGrant.id.substring(0, 8)}...
                                </TabsTrigger>
                              ))
                            ) : (
                              <TabsTrigger value="no-grants" disabled>
                                No Raw Grants
                              </TabsTrigger>
                            )}
                          </TabsList>
                          <TabsContent value="details" className="mt-4">
                            <div className="bg-muted/50 p-4 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Grant URL</h4>
                                  <p className="text-sm">
                                    {row.original.grant_url ? (
                                      <a 
                                        href={row.original.grant_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                        title={row.original.grant_url}
                                      >
                                        {truncateUrl(row.original.grant_url, 60)}
                                      </a>
                                    ) : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Grant Date</h4>
                                  <p className="text-sm">
                                    {row.original.grant_date ? new Date(row.original.grant_date).toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {row.original.grant_description || "N/A"}
                                  </p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Eligibility</h4>
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {row.original.grant_eligibility || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          {expandedRowRawGrants[row.original.id] && expandedRowRawGrants[row.original.id].map((rawGrant: any) => (
                            <TabsContent key={rawGrant.id} value={rawGrant.id} className="mt-4">
                              <div className="bg-muted/50 p-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Column 1 */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Created At</h4>
                                      <p className="text-sm">
                                        {rawGrant.created_at ? new Date(rawGrant.created_at).toLocaleString() : "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Grant Name</h4>
                                      <p className="text-sm">
                                        {rawGrant.grant_name || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Organization</h4>
                                      <p className="text-sm">
                                        {rawGrant.grant_organisation || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Amount</h4>
                                      <p className="text-sm">
                                        {rawGrant.grant_amount || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Column 2 */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Date</h4>
                                      <p className="text-sm">
                                        {rawGrant.grant_date || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">URL</h4>
                                      <p className="text-sm">
                                        {rawGrant.grant_url ? (
                                          <a 
                                            href={rawGrant.grant_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                            title={rawGrant.grant_url}
                                          >
                                            {truncateUrl(rawGrant.grant_url, 60)}
                                          </a>
                                        ) : "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {rawGrant.grant_description || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Eligibility</h4>
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {rawGrant.grant_eligibility || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount} entries
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(0, pageIndex - 1))}
                  className={pageIndex > 0 ? "cursor-pointer" : "pointer-events-none opacity-50"}
                />
              </PaginationItem>
              
              {/* Page numbers - Dynamic sliding window */}
              {(() => {
                const totalPages = Math.ceil(totalCount / pageSize);
                const currentPage = pageIndex + 1;
                const maxVisiblePages = 5;
                
                // Calculate start and end pages for the sliding window
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // Adjust startPage if we're near the end
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                const pages = Array.from(
                  { length: endPage - startPage + 1 },
                  (_, i) => startPage + i
                );
                
                return (
                  <>
                    {/* Show first page and ellipsis if not in first window */}
                    {startPage > 1 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(0)}
                            isActive={pageIndex === 0}
                            className="cursor-pointer px-2 py-1 text-sm"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {startPage > 2 && (
                          <PaginationItem>
                            <span className="px-1 sm:px-2 text-sm">...</span>
                          </PaginationItem>
                        )}
                      </>
                    )}
                    
                    {/* Show page numbers in current window */}
                    {pages.map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page - 1)}
                          isActive={pageIndex === page - 1}
                          className="cursor-pointer px-2 py-1 text-sm"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {/* Show ellipsis and last page if not in last window */}
                    {endPage < totalPages && (
                      <>
                        {endPage < totalPages - 1 && (
                          <PaginationItem>
                            <span className="px-1 sm:px-2 text-sm">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages - 1)}
                            isActive={pageIndex === totalPages - 1}
                            className="cursor-pointer px-2 py-1 text-sm"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                  </>
                );
              })()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(pageIndex + 1)}
                  className={pageIndex < Math.ceil(totalCount / pageSize) - 1 ? "cursor-pointer" : "pointer-events-none opacity-50"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
