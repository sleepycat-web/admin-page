"use client";
import { useState, useEffect } from "react";
import Login from "./login";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = () => {
      const loginExpiration = localStorage.getItem("loginExpiration");
      if (
        loginExpiration &&
        new Date().getTime() < parseInt(loginExpiration, 10)
      ) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  const handleLoginSuccess = () => {
    // Set expiration to one month from now
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    localStorage.setItem(
      "loginExpiration",
      expirationDate.getTime().toString()
    );
    setIsLoggedIn(true);
  };

  if (isLoading) {
    return <div></div>; // Or any loading indicator
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
};

export default ClientLayout;
