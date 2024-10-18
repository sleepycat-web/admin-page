import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BanHistoryEntry {
  date: string;
  reason: string;
}

interface BannedUser {
  name: string;
  phoneNumber: string;
  banDate: string;
  banHistory: BanHistoryEntry[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date
    .toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " ")
    .replace("AM", "am")
    .replace("PM", "pm");
};

const BanHistoryCell = ({ history }: { history: BanHistoryEntry[] }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!history || history.length === 0) {
    return <div className="text-sm text-gray-500">No history</div>;
  }

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full"
      >
        <span>
          {history.length} {history.length === 1 ? "entry" : "entries"}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {history.map((entry, index) => (
            <div key={index} className="rounded-md bg-muted p-2 text-sm">
              <div className="font-medium">{formatDate(entry.date)}</div>
              <div className="text-muted-foreground">
                Reason: {entry.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const columns: ColumnDef<BannedUser>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-start"
        >
          Name
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="w-full">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
    cell: ({ row }) => (
      <div className="w-full">{row.getValue("phoneNumber")}</div>
    ),
  },
  {
    accessorKey: "banDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full justify-start"
        >
          Date Banned
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="w-full">{formatDate(row.getValue("banDate"))}</div>
      );
    },
  },
  {
    id: "banHistory",
    header: "Ban History",
    cell: ({ row }) => (
      <div className="md:w-[300px]">
        <BanHistoryCell history={row.original.banHistory} />
      </div>
    ),
  },
];
function DataTableDemo() {
  const [data, setData] = React.useState<BannedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    const fetchBannedUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/getBannedUsers");
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const bannedUsers = await response.json();
        setData(bannedUsers);
      } catch (error) {
        console.error("Error fetching banned users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBannedUsers();
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Search"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function BanDataComp() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">Banned Users</h1>
      <DataTableDemo />
    </div>
  );
}
