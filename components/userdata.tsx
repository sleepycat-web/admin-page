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
import { Loader2 } from "lucide-react";

 
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

  useEffect(() => {
    fetchUsers();
  }, []);
    
const fetchUsers = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("/api/userDataHandler");
    const data = await response.json();
    console.log("Raw data from API:", data); // Debugging line

    // Sort users from newest to oldest
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

   // Create a new Date object with the UTC time
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

 

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">User Data</h1>
      <Input
        placeholder="Search "
        value={searchTerm}
        onChange={handleSearch}
        className="max-w-sm"
      />
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
            filterUsers().map((user) => (
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
