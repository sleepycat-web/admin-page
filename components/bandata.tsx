import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

type SortField = "name" | "banDate";
type SortDirection = "asc" | "desc";

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

const BanDataComp: React.FC = () => {
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const usersPerPage = 30;

  const [sortConfig, setSortConfig] = useState<{
    key: SortField;
    direction: SortDirection;
  }>({ key: "banDate", direction: "desc" });

  const fetchBannedUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/getBannedUsers");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const bannedUsers = await response.json();
      setUsers(bannedUsers);
    } catch (error) {
      console.error("Error fetching banned users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBannedUsers();
  }, [fetchBannedUsers]);

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter((user) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchTermLower) ||
          user.phoneNumber.includes(searchTermLower) ||
          formatDate(user.banDate).toLowerCase().includes(searchTermLower)
        );
      })
      .sort((a, b) => {
        if (sortConfig.key === "name") {
          return sortConfig.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          const dateA = new Date(a.banDate);
          const dateB = new Date(b.banDate);
          return sortConfig.direction === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }
      });
  }, [users, searchTerm, sortConfig]);

  const handleSort = useCallback((key: SortField) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setCurrentPage(1);
    },
    []
  );

  const indexOfLastUser = showAll
    ? filteredAndSortedUsers.length
    : currentPage * usersPerPage;
  const indexOfFirstUser = showAll ? 0 : indexOfLastUser - usersPerPage;
  const currentUsers = filteredAndSortedUsers.slice(
    indexOfFirstUser,
    indexOfLastUser
  );
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

  const paginate = useCallback(
    (pageNumber: number) => setCurrentPage(pageNumber),
    []
  );

  const renderPaginationButtons = useCallback(() => {
    const buttons = [];
    const maxVisiblePages = 5;

    buttons.push(
      <Button
        key="prev"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );

    for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
      buttons.push(
        <Button
          key={i}
          onClick={() => paginate(i)}
          variant={currentPage === i ? "default" : "outline"}
        >
          {i}
        </Button>
      );
    }

    if (totalPages > maxVisiblePages) {
      buttons.push(<span key="ellipsis">...</span>);

      if (currentPage > maxVisiblePages && currentPage < totalPages - 1) {
        buttons.push(
          <Button
            key={currentPage}
            onClick={() => paginate(currentPage)}
            variant="default"
          >
            {currentPage}
          </Button>
        );
      }

      if (totalPages - 1 > maxVisiblePages) {
        buttons.push(
          <Button
            key={totalPages - 1}
            onClick={() => paginate(totalPages - 1)}
            variant={currentPage === totalPages - 1 ? "default" : "outline"}
          >
            {totalPages - 1}
          </Button>
        );
      }

      buttons.push(
        <Button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          variant={currentPage === totalPages ? "default" : "outline"}
        >
          {totalPages}
        </Button>
      );
    }

    buttons.push(
      <Button
        key="next"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );

    return buttons;
  }, [currentPage, totalPages, paginate]);

  const renderSortableHeader = useCallback(
    (column: SortField, label: string) => (
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => handleSort(column)}
          className="w-full justify-start"
        >
          {label}{" "}
          {sortConfig.key === column &&
            (sortConfig.direction === "asc" ? "↑" : "↓")}
        </Button>
      </TableHead>
    ),
    [handleSort, sortConfig]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">Banned Users</h1>
      {!isLoading && (
        <div className="text-sm ">Total banned users: {users.length}</div>
      )}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
        <Button onClick={() => setShowAll(!showAll)} variant="outline">
          {showAll ? "Show Paginated" : "Show All"}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {renderSortableHeader("name", "Name")}
              <TableHead>Phone Number</TableHead>
              {renderSortableHeader("banDate", "Date Banned")}
              <TableHead>Ban History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : currentUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              currentUsers.map((user) => (
                <TableRow key={user.phoneNumber}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>{formatDate(user.banDate)}</TableCell>
                  <TableCell>
                    <div className="md:w-[300px]">
                      <BanHistoryCell history={user.banHistory} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && !showAll && filteredAndSortedUsers.length > 0 && (
        <div className="flex justify-end mt-4">
          <div className="flex space-x-2">{renderPaginationButtons()}</div>
        </div>
      )}
    </div>
  );
};

export default BanDataComp;
