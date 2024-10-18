import React, { useState, useEffect } from "react";
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

const UserDataComp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const usersPerPage = 30;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/userDataHandler");
      const data = await response.json();
      console.log("Raw data from API:", data);

      const sortedUsers = data.sort((a: User, b: User) => {
        const dateA = parseDate(a.signupDate);
        const dateB = parseDate(b.signupDate);
        return dateB.getTime() - dateA.getTime();
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateInput: string | { $date: string } | Date): string => {
    const date = parseDate(dateInput);

    if (isNaN(date.getTime())) {
      console.error("Invalid date after parsing:", dateInput);
      return "Invalid Date";
    }

    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

    return utcDate.toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const filterUsers = () => {
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    return users.filter((user) => {
      const formattedDate = formatDate(user.signupDate).toLowerCase();
      return (
        user.name.toLowerCase().includes(lowercaseSearchTerm) ||
        user.phoneNumber.includes(lowercaseSearchTerm) ||
        formattedDate.includes(lowercaseSearchTerm)
      );
    });
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

  const filteredUsers = filterUsers();
  const indexOfLastUser = showAll
    ? filteredUsers.length
    : currentPage * usersPerPage;
  const indexOfFirstUser = showAll ? 0 : indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
  };

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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">User Data</h1>
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
        <Button onClick={toggleShowAll} variant="outline">
          {showAll ? "Show Paginated" : "Show All"}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Signup Date</TableHead>
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
              <TableRow key={user.phoneNumber} className="group">
                <TableCell>
                  <span className={user.banStatus ? "text-red-600" : ""}>
                    {user.name}
                    {user.banStatus ? " (Banned)" : ""}
                  </span>
                </TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>{formatDate(user.signupDate)}</TableCell>
                <TableCell>
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewName(e.target.value)
                          }
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
