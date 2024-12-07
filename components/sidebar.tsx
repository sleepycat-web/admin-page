import React, { useState, ReactNode, useRef, useEffect, useCallback } from "react";
import {
  Ban as BanIcon,
  ChartColumn,
  Menu as MenuIcon,
  X as XIcon,
  FileText as DatabaseIcon,
  User,
  IndianRupee,
  BadgePercent, // New import
} from "lucide-react";
import AnalyticsComp from "./analytics";
import BanComp from "./ban";
import BanDataComp from "./bandata";
import { Button } from "@/components/ui/button";
import UserDataComp from "./userdata";
import CashBalanceComp from "./cashbalance";
import PromoComp from "./promo"; // New import

// Placeholder components for Analytics, Ban, and BanData
const Analytics = () => (
  <div>
    <AnalyticsComp />
  </div>
);
const BanComponent = () => (
  <div>
    <BanComp />
  </div>
);
const CashBalanceComponent = () => (
  <div>
    <CashBalanceComp />
  </div>
);
const BanDataComponent = () => (
  <div>
    <BanDataComp />
  </div>
);
const UserDataComponent = () => (
  <div>
    <UserDataComp />
  </div>
);
const PromoComponent = () => (
  <div>
    <PromoComp />
  </div>
);

interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({
  children,
  className,
}) => <div className={className}>{children}</div>;

type ComponentType =
  | "analytics"
  | "ban"
  | "banData"
  | "userData"
  | "cashBalance"
  | "promo"; // Added "promo"

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Sidebar = () => {
  const [activeComponent, setActiveComponent] =
    useState<ComponentType>("analytics");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mountedComponents, setMountedComponents] = useState<{
    [key in ComponentType]?: React.ReactNode;
  }>({});
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMountKey((prev) => prev + 1);
      setMountedComponents({});
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const NavButton: React.FC<NavButtonProps> = ({
    icon,
    label,
    isActive,
    onClick,
  }) => (
    <Button
      variant="ghost"
      className={`w-full justify-start ${isActive ? "bg-neutral-800" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );

  const navItems: Array<{
    icon: React.ReactNode;
    label: string;
    component: ComponentType;
  }> = [
    {
      icon: <ChartColumn className="h-4 w-4" />,
      label: "Analytics",
      component: "analytics",
    },
    {
      icon: <User className="h-4 w-4" />,
      label: "User Data",
      component: "userData",
    },
    {
      icon: <BanIcon className="h-4 w-4" />,
      label: "Ban",
      component: "ban",
    },
    {
      icon: <DatabaseIcon className="h-4 w-4" />,
      label: "Ban Data",
      component: "banData",
    },
    {
      icon: <IndianRupee className="h-4 w-4" />,
      label: "Cash Balance",
      component: "cashBalance",
    },
    {
      icon: <BadgePercent className="h-4 w-4" />, // New icon
      label: "Promo Codes",
      component: "promo",
    },
  ];

  const getActiveComponentLabel = () => {
    return (
      navItems.find((item) => item.component === activeComponent)?.label || ""
    );
  };

  const renderComponent = useCallback(() => {
    if (mountedComponents[activeComponent]) {
      return;
    }

    let component: React.ReactNode = null;
    switch (activeComponent) {
      case "analytics":
        component = <Analytics />;
        break;
      case "ban":
        component = <BanComponent />;
        break;
      case "banData":
        component = <BanDataComponent />;
        break;
      case "userData":
        component = <UserDataComponent />;
        break;
      case "cashBalance":
        component = <CashBalanceComponent />;
        break;
      case "promo":
        component = <PromoComponent />;
        break;
      default:
        component = <Analytics />;
    }

    setMountedComponents((prev) => ({ ...prev, [activeComponent]: component }));
  }, [activeComponent, mountedComponents]);

  useEffect(() => {
    renderComponent();
  }, [activeComponent, renderComponent]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Horizontal sidebar for mobile */}
      <div
        ref={sidebarRef}
        className={`
          md:hidden bg-neutral-900 transition-all  overflow-hidden
          ${isMobileMenuOpen ? "y" : "h-16 duration-300 ease-in-out"}
        `}
      >
        <div className="flex justify-between items-center p-4">
          <h1 className="md:text-xl text-lg font-semibold text-white">
            {getActiveComponentLabel()}
          </h1>
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </Button>
        </div>
        {isMobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-2">
            {navItems.map((item) => (
              <NavButton
                key={item.component}
                icon={item.icon}
                label={item.label}
                isActive={activeComponent === item.component}
                onClick={() => {
                  setActiveComponent(item.component);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>
        )}
      </div>

      {/* Vertical sidebar for desktop */}
      <div className="hidden md:flex flex-grow">
        <div className="w-52 bg-neutral-900 p-4 flex flex-col">
          <h1 className="text-xl font-semibold text-white mb-4">Dashboard</h1>
          <nav className="space-y-2 flex-grow">
            {navItems.map((item) => (
              <NavButton
                key={item.component}
                icon={item.icon}
                label={item.label}
                isActive={activeComponent === item.component}
                onClick={() => setActiveComponent(item.component)}
              />
            ))}
          </nav>
        </div>

        {/* Main content */}
        <ContentWrapper key={mountKey} className="flex-1 p-4">
          {/* Display mounted components and control visibility */}
          {Object.entries(mountedComponents).map(([key, component]) => (
            <div
              key={key}
              style={{ display: activeComponent === key ? "block" : "none" }}
            >
              {component}
            </div>
          ))}
        </ContentWrapper>
      </div>

      {/* Main content for mobile */}
      <ContentWrapper key={mountKey} className="md:hidden flex-1 p-4">
        {/* Display mounted components and control visibility */}
        {Object.entries(mountedComponents).map(([key, component]) => (
          <div
            key={key}
            style={{ display: activeComponent === key ? "block" : "none" }}
          >
            {component}
          </div>
        ))}
      </ContentWrapper>
    </div>
  );
};

export default Sidebar;
