import React, { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserData {
  _id: string;
  phoneNumber: string;
  name: string;
  banStatus: boolean;
  banDate?: string;
  banHistory?: Array<{ date: string; reason: string }>;
}

const BanComp: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showErrorMessage, setShowErrorMessage] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>("");
  const [shouldCreateBan, setShouldCreateBan] = useState<boolean>(false);

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setShowErrorMessage("");
    setShouldCreateBan(false);
  };

  const validatePhoneNumber = (): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleCheck = async (): Promise<void> => {
    const isValid = validatePhoneNumber();
    if (isValid) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/checkData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber }),
        });
        const data = await response.json();
        if (data.found) {
          setUserData(data.userData);
        } else {
          setUserData(null);
          setShouldCreateBan(true);
        }
        setOpenDialog(true);
      } catch (error) {
        console.error("Error checking user data:", error);
        setShowErrorMessage("Error checking user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowErrorMessage("Please enter a valid phone number");
    }
  };

  const handleBanStatusChange = async (): Promise<void> => {
    if (userData) {
      setIsLoading(true);
      const newBanStatus = !userData.banStatus;
      try {
        const response = await fetch("/api/updateBanStatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: userData.phoneNumber,
            newBanStatus: newBanStatus,
            banReason: newBanStatus ? banReason : undefined,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setUserData({
            ...userData,
            banStatus: newBanStatus,
            banDate: newBanStatus ? new Date().toISOString() : undefined,
            banHistory: result.banHistory,
          });
          setBanReason("");
        } else {
          throw new Error("Failed to update ban status");
        }
      } catch (error) {
        console.error("Error updating ban status:", error);
        setShowErrorMessage("Failed to update ban status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else if (shouldCreateBan) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/updateBanStatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            newBanStatus: true,
            banReason,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setUserData({
            _id: "new",
            phoneNumber,
            name: "Unregistered User",
            banStatus: true,
            banDate: new Date().toISOString(),
            banHistory: [
              {
                date: new Date().toISOString(),
                reason: banReason,
              },
            ],
          });
          setBanReason("");
          setShouldCreateBan(false);
        } else {
          throw new Error("Failed to create ban entry");
        }
      } catch (error) {
        console.error("Error creating ban entry:", error);
        setShowErrorMessage("Failed to create ban entry. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (showErrorMessage) {
      const timer = setTimeout(() => {
        setShowErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorMessage]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(dateString)
      .toLocaleString("en-US", options)
      .replace(",", "");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold md:block hidden">
        User Ban Management
      </h1>
      <div className="flex space-x-2">
        <Input
          className=" max-w-sm"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          maxLength={10}
          type="tel"
          inputMode="numeric"
        />
        <Button variant="secondary" onClick={handleCheck} disabled={isLoading}>
          {isLoading ? "Checking..." : "Check"}
        </Button>
      </div>
      {showErrorMessage && <p className="text-red-500">{showErrorMessage}</p>}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {userData ? (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between">
                <Label htmlFor="name" className="font-semibold">
                  Name
                </Label>
                <Label htmlFor="username">{userData.name}</Label>
              </div>
              <div className="flex justify-between">
                <Label htmlFor="phone" className="font-semibold">
                  Phone
                </Label>
                <Label htmlFor="phone-value">{userData.phoneNumber}</Label>
              </div>
              <div className="flex justify-between">
                <Label htmlFor="status" className="font-semibold">
                  Ban Status
                </Label>
                <Label
                  htmlFor="status-value"
                  className={
                    userData.banStatus ? "text-red-500" : "text-green-500"
                  }
                >
                  {userData.banStatus ? "Banned" : "Not Banned"}
                </Label>
              </div>
              {userData.banStatus && userData.banDate && (
                <div className="flex justify-between">
                  <Label htmlFor="banDate" className="font-semibold">
                    Banned on
                  </Label>
                  <Label htmlFor="banDate-value">
                    {formatDate(userData.banDate)}
                  </Label>
                </div>
              )}
              {userData.banHistory && userData.banHistory.length > 0 && (
                <div>
                  <Label className="font-semibold">Ban History</Label>
                  <ul className="  mt-2">
                    {userData.banHistory.map((entry, index) => (
                      <li key={index}>
                        {formatDate(entry.date)} - {entry.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {!userData.banStatus && (
              <div className="">
                <Label htmlFor="banReason" className="font-semibold">
                  Reason for Ban
                </Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning the user"
                  className="mt-1"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={handleBanStatusChange}
                disabled={isLoading || (!userData.banStatus && !banReason)}
              >
                {isLoading
                  ? "Updating..."
                  : userData.banStatus
                  ? "Unban User"
                  : "Ban User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>User Details not found</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between">
                <Label htmlFor="phone" className="font-semibold">
                  Phone
                </Label>
                  <Label htmlFor="phone-value">{phoneNumber}</Label>
                  
              </div>
              <div>
                <Label htmlFor="banReason" className="font-semibold">
                  Reason for Ban
                </Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning the user"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={handleBanStatusChange}
                disabled={isLoading || !banReason}
              >
                {isLoading ? "Banning..." : "Ban User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default BanComp;
