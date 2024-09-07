import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const BanComp = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Ban</h1>
      <div className="flex space-x-2">
        <Input
          className="flex-grow"
          placeholder="Enter phone number"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Check</Button>
          </DialogTrigger>
          {/* On Find */}
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between">
                <Label htmlFor="name" className="font-semibold">
                  Name
                </Label>
                <Label htmlFor="username">Sample</Label>
              </div>
              <div className="flex justify-between">
                <Label htmlFor="phone" className="font-semibold">
                  Phone
                </Label>
                <Label htmlFor="phone-value">81910231231</Label>
              </div>
              <div className="flex justify-between">
                <Label htmlFor="status" className="font-semibold">
                  Status
                </Label>
                <Label htmlFor="status-value">Tester</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="submit">
                Confirm Ban
              </Button>
            </DialogFooter>
          </DialogContent>
          {/* On Not find */}
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Details not found</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BanComp;
