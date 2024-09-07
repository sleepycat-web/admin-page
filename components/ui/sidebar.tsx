import React, { useState, ReactNode, useRef, useEffect } from "react";
import {
  Ban as BanIcon,
  ChartColumn,
  Menu as MenuIcon,
  X as XIcon,
  FileText as DatabaseIcon,
} from "lucide-react";
import AnalyticsComp from "../analytics";
import BanComp from "../ban";
import BanDataComp from "../bandata";
import { Button } from "@/components/ui/button";

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
const BanDataComponent = () => (
  <div>
    <BanDataComp />
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

type ComponentType = "analytics" | "ban" | "banData";

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  indent?: boolean;
}

const Sidebar = () => {
  const [activeComponent, setActiveComponent] =
    useState<ComponentType>("analytics");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  const renderComponent = () => {
    switch (activeComponent) {
      case "analytics":
        return <Analytics />;
      case "ban":
        return <BanComponent />;
      case "banData":
        return <BanDataComponent />;
      default:
        return <Analytics />;
    }
  };

  const NavButton: React.FC<NavButtonProps> = ({
    icon,
    label,
    isActive,
    onClick,
    indent = false,
  }) => (
    <Button
      variant="ghost"
      className={`w-full justify-start ${isActive ? "bg-neutral-800" : ""} ${
        indent ? "pl-8" : ""
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );

  const navItems: Array<{
    icon: React.ReactNode;
    label: string;
    component: ComponentType;
    children?: Array<{
      icon: React.ReactNode;
      label: string;
      component: ComponentType;
    }>;
  }> = [
    {
      icon: <ChartColumn className="mr-2 h-4 w-4" />,
      label: "Analytics",
      component: "analytics",
    },
    {
      icon: <BanIcon className="mr-2 h-4 w-4" />,
      label: "Ban",
      component: "ban",
      children: [
        {
          icon: <DatabaseIcon className="mr-2 h-4 w-4" />,
          label: "Ban Data",
          component: "banData",
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Hamburger menu for mobile */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          className="p-2 m-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar for desktop and mobile menu */}
      <div
        ref={sidebarRef}
        className={`
          fixed md:relative z-10 w-52 h-full bg-neutral-900
          transition-transform ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <Button
              variant="ghost"
              className="md:hidden p-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <XIcon className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <React.Fragment key={item.component}>
                <NavButton
                  icon={item.icon}
                  label={item.label}
                  isActive={activeComponent === item.component}
                  onClick={() => {
                    setActiveComponent(item.component);
                    setIsMobileMenuOpen(false);
                  }}
                />
                {item.children &&
                  item.children.map((child) => (
                    <NavButton
                      key={child.component}
                      icon={child.icon}
                      label={child.label}
                      isActive={activeComponent === child.component}
                      onClick={() => {
                        setActiveComponent(child.component);
                        setIsMobileMenuOpen(false);
                      }}
                      indent
                    />
                  ))}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <ContentWrapper className="flex-1 p-4 ">
        {renderComponent()}
      </ContentWrapper>
    </div>
  );
};

export default Sidebar;
