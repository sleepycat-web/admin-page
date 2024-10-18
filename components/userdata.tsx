import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  name: string;
  phoneNumber: string;
  banStatus: boolean;
  signupDate: string | { $date: string } | Date;
}

type SortField = "name" | "signupDate";
type SortDirection = "asc" | "desc";

const UserDataComp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const usersPerPage = 30;

  const [sortConfig, setSortConfig] = useState<{
    key: SortField;
    direction: SortDirection;
  }>({ key: "signupDate", direction: "desc" });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/userDataHandler");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, sortConfig]);

  const filterAndSortUsers = () => {
    let filtered = users.filter((user) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchTermLower) ||
        user.phoneNumber.includes(searchTermLower) ||
        formatDate(user.signupDate).toLowerCase().includes(searchTermLower)
      );
    });

    filtered.sort((a, b) => {
      if (sortConfig.key === "name") {
        return sortConfig.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = parseDate(a.signupDate);
        const dateB = parseDate(b.signupDate);
        return sortConfig.direction === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key: SortField) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };
 

  const parseDate = (dateInput: string | { $date: string } | Date): Date => {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    if (typeof dateInput === "string") {
      return new Date(dateInput);
    }
    if (dateInput && "$date" in dateInput) {
      return new Date(dateInput.$date);
    }
    console.error("Invalid date format:", dateInput);
    return new Date(0);
  };
const cutoffDate = new Date("2024-09-21");
   const formatDate = (
     dateInput: string | { $date: string } | Date
   ): string => {
     const date = parseDate(dateInput);
     if (isNaN(date.getTime())) {
       console.error("Invalid date after parsing:", dateInput);
       return "Invalid Date";
     }

     // Subtract 5 hours and 30 minutes
     const adjustedDate = new Date(date.getTime() - (5 * 60 + 30) * 60000);

     if (adjustedDate < cutoffDate) {
       // For dates before September 21, 2024, show only the date
       return adjustedDate
         .toLocaleString("en-US", {
           day: "numeric",
           month: "long",
           year: "numeric",
           timeZone: "Asia/Kolkata",
         })
         .replace(",", "");
;
     } else {
       // For dates after September 21, 2024, show both date and time
       return adjustedDate
         .toLocaleString("en-US", {
           day: "numeric",
           month: "long",
           year: "numeric",
           hour: "numeric",
           minute: "2-digit",
           hour12: true,
           timeZone: "Asia/Kolkata",
         })
         .replace(",", "");
     }
   };


  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewName(user.name);
  };

  const handleSave = async () => {
    if (editingUser) {
      await fetch("/api/userDataHandler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: editingUser.phoneNumber, newName }),
      });
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleDelete = async (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await fetch("/api/userDataHandler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: userToDelete.phoneNumber }),
      });
      setUserToDelete(null);
      fetchUsers();
    }
  };

  const indexOfLastUser = showAll
    ? filteredUsers.length
    : currentPage * usersPerPage;
  const indexOfFirstUser = showAll ? 0 : indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPaginationButtons = () => {
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
  };
  const renderSortableHeader = (column: SortField, label: string) => (
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
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">Users</h1>
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
              {renderSortableHeader("signupDate", "Signup Date")}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : (
              currentUsers.map((user) => (
                <TableRow key={user.phoneNumber} className="group ">
                  <TableCell className="py-2">
                    <span className={user.banStatus ? "text-red-600" : ""}>
                      {user.name}
                      {user.banStatus ? " (Banned)" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">{user.phoneNumber}</TableCell>
                  <TableCell className="py-2">
                    {formatDate(user.signupDate)}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <Input
                            value={newName}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setNewName(e.target.value)}
                            placeholder="New name"
                          />
                          <Button onClick={handleSave}>Save</Button>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(user)}
                        className="ml-2"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && !showAll && filteredUsers.length > 0 && (
        <div className="flex justify-end mt-4">
          <div className="flex space-x-2">{renderPaginationButtons()}</div>
        </div>
      )}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDataComp;
