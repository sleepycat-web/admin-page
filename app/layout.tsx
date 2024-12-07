// layout.tsx
import type { Metadata } from "next";
 import "./globals.css";
import ClientLayout from "./clientlayout";
import { ThemeProvider } from "../components/ui/theme-provider";

export const metadata: Metadata = {
  title: "Chai Mine Admin",
  description: "",
};

 const RootLayout = ({ children }: { children: React.ReactNode }) => {
   return (
     <>
       <html lang="en" suppressHydrationWarning>
         <head />
         <body>
           <ThemeProvider
             attribute="class"
             defaultTheme="dark"
             enableSystem
             disableTransitionOnChange
           >
             <ClientLayout>{children}</ClientLayout>
           </ThemeProvider>
         </body>
       </html>
     </>
   );
 };

 export default RootLayout;


 