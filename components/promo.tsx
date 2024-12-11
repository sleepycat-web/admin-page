"use client";

import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
 import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react"; // Add Loader2, ChevronLeft, ChevronRight imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Add AlertDialog imports

interface PromoCode {
  _id?: string;
  code: string;
  percentage: number;
}

// Define a separate interface for input states with percentage as a string
interface PromoCodeInput {
  code: string;
  percentage: string;
}

interface SortConfig {
  key: "code" | "percentage";
  direction: "asc" | "desc";
}

// For editingPromo, create a similar input state handling
interface PromoCodeEditable {
  _id?: string;
  code: string;
  percentage: string;
}

export default function PromoComp() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newPromo, setNewPromo] = useState<PromoCodeInput>({
    code: "",
    percentage: "",
  });
  const [editingPromo, setEditingPromo] = useState<PromoCodeEditable | null>(null);
  const [isAdding, setIsAdding] = useState(false); // Add loading state
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null); // Add state
  const [searchTerm, setSearchTerm] = useState(""); // Added searchTerm state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null); // Added sortConfig state
  const [addError, setAddError] = useState<string | null>(null); // Add error state for add modal
  const [editError, setEditError] = useState<string | null>(null); // Add error state for edit modal
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const promoPerPage = 30;
  const [isLoading, setIsLoading] = useState(true); // Add this line
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // Add this new state

  // Fetch promocodes on component mount
  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setIsLoading(true); // Add this line
    try {
      const response = await fetch("/api/promo");
      const data = await response.json();
      setPromoCodes(data);
    } catch (error) {
      console.error("Failed to fetch promocodes", error);
    } finally {
      setIsLoading(false); // Add this line
    }
  };

  const handleAddPromo = async () => {
    const percentageNumber = parseFloat(newPromo.percentage);
    if (newPromo.code.trim() === "") {
      setAddError("Promo code cannot be empty.");
      setIsAdding(false);
      return;
    }
    if (isNaN(percentageNumber) || percentageNumber <= 0) {
      setAddError("Percentage must be greater than 0.");
      setIsAdding(false);
      return;
    }
    setAddError(null); // Clear previous error
    setIsAdding(true); // Start loader
    try {
      const response = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPromo, percentage: percentageNumber }), // Convert percentage to number
      });

      if (response.ok) {
        fetchPromoCodes();
        setNewPromo({ code: "", percentage: "" });
        setIsAdding(false);
        setIsAddDialogOpen(false); // Close the dialog after successful addition
      }
    } catch (error) {
      console.error("Failed to add promocode", error);
      setIsAdding(false);
    }
  };

  const handleEditPromo = async () => {
    if (!editingPromo) return; // Ensure editingPromo is not null

    const percentageNumber = parseFloat(editingPromo.percentage);
    if (editingPromo.code.trim() === "") {
      setEditError("Promo code cannot be empty.");
      return;
    }
    if (isNaN(percentageNumber) || percentageNumber <= 0) {
      setEditError("Percentage must be greater than 0.");
      return;
    }
    setEditError(null); // Clear previous error

    try {
      const response = await fetch(`/api/promo?id=${editingPromo._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingPromo, percentage: percentageNumber }), // Convert percentage to number
      });

      if (response.ok) {
        fetchPromoCodes();
        setEditingPromo(null);
      }
    } catch (error) {
      console.error("Failed to edit promocode", error);
    }
  };

  const handleDeletePromo = async () => {
    if (!promoToDelete?._id) return;

    try {
      const response = await fetch(`/api/promo?id=${promoToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPromoCodes();
        setPromoToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete promocode", error);
    }
  };

  // Add sorting and filtering logic
  const filteredPromoCodes = useMemo(() => {
    return promoCodes.filter((promo) =>
      promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.percentage.toString().includes(searchTerm)
    );
  }, [promoCodes, searchTerm]);

  const sortedPromoCodes = useMemo(() => {
    if (sortConfig !== null) {
      return [...filteredPromoCodes].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredPromoCodes;
  }, [filteredPromoCodes, sortConfig]);

  const handleSort = (key: SortConfig["key"]) => {
    let direction: SortConfig["direction"] = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Add pagination calculations
  const indexOfLastPromo = showAll ? sortedPromoCodes.length : currentPage * promoPerPage;
  const indexOfFirstPromo = showAll ? 0 : indexOfLastPromo - promoPerPage;
  const currentPromos = sortedPromoCodes.slice(indexOfFirstPromo, indexOfLastPromo);
  const totalPages = Math.ceil(sortedPromoCodes.length / promoPerPage);

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
      <h1 className="text-lg font-semibold md:block hidden">Promo Codes</h1>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                className="w-full max-w-sm"
              />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add New Promo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Promo Code</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-left text-md ">
                        Promo Code
                      </Label>
                      <Input
                        id="code"
                        value={newPromo.code}
                        onChange={
                          (e) =>
                            setNewPromo({
                              ...newPromo,
                              code: e.target.value.toUpperCase(),
                            }) // Convert promo code to uppercase
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="percentage"
                        className=" text-md text-left"
                      >
                        Percentage
                      </Label>
                      <Input
                        id="percentage"
                        type="number"
                        min={1} // Prevent negative input
                        value={newPromo.percentage}
                        onChange={(e) =>
                          setNewPromo({
                            ...newPromo,
                            percentage: e.target.value, // Handle as string
                          })
                        }
                        className="col-span-3"
                      />
                    </div>
                    {addError && <p className="text-red-500">{addError}</p>}{" "}
                    {/* Display add error */}
                    <Button onClick={handleAddPromo}>
                      {isAdding ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Add Promo"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Button onClick={() => setShowAll(!showAll)} variant="outline">
              {showAll ? "Show Paginated" : "Show All"}
            </Button>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("code")}
                    className="w-full justify-start"
                  >
                    Promo Code{" "}
                    {sortConfig?.key === "code"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("percentage")}
                    className="w-full justify-start"
                  >
                    Percentage{" "}
                    {sortConfig?.key === "percentage"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className=" text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : currentPromos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                currentPromos.map((promo) => (
                  <TableRow key={promo._id}>
                    <TableCell className="py-2">{promo.code}</TableCell>
                    <TableCell className="py-2">{promo.percentage}%</TableCell>
                    <TableCell className="py-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setEditingPromo({
                              ...promo,
                              percentage: promo.percentage.toString(),
                            })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setPromoToDelete(promo)} // Update onClick
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!showAll && sortedPromoCodes.length > promoPerPage && (
          <div className="flex justify-end mt-4">
            <div className="flex space-x-2">{renderPaginationButtons()}</div>
          </div>
        )}

        {/* Edit Promo Dialog */}
        {editingPromo && (
          <Dialog
            open={!!editingPromo}
            onOpenChange={() => {
              setEditingPromo(null);
              setEditError(null); // Clear edit error when closing dialog
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Promo Code</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-code" className="text-md text-left">
                    Promo Code
                  </Label>
                  <Input
                    id="edit-code"
                    value={editingPromo.code}
                    onChange={
                      (e) =>
                        setEditingPromo({
                          ...editingPromo,
                          code: e.target.value.toUpperCase(),
                        }) // Convert edited promo code to uppercase
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit-percentage"
                    className="text-md text-left"
                  >
                    Percentage
                  </Label>
                  <Input
                    id="edit-percentage"
                    type="number"
                    min={1} // Prevent negative input
                    value={editingPromo?.percentage}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo!,
                        percentage: e.target.value, // Handle as string
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                {editError && <p className="text-red-500">{editError}</p>}{" "}
                {/* Display edit error */}
                <Button onClick={handleEditPromo}>Update Promo</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <AlertDialog
          open={!!promoToDelete}
          onOpenChange={() => setPromoToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this promo code?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                promo code from the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePromo}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
