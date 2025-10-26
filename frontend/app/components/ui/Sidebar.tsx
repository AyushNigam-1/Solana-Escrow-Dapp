"use client"

import React, { FC, SVGProps, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation';
type IconComponent = FC<SVGProps<SVGSVGElement>>;

// Define the structure for the navigation item badge
interface Badge {
  content: string;
  className: string;
}

// Define the structure for the navigation item props
interface NavItemProps {
  icon: IconComponent;
  text: string;
  route: string;
  onNavigate: (route: string) => void; // The callback function from the parent
  isActive: boolean;
}

// --- Icon Components (Typed) ---

const MenuToggleIcon: IconComponent = (props) => (
  <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
  </svg>
);

const TokensIcon: IconComponent = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);

const DealsIcon: IconComponent = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const HisotryIcon: IconComponent = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const SettingsIcon: IconComponent = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const NavItem: FC<NavItemProps> = ({ icon: Icon, text, onNavigate, route, isActive }) => (
  console.log("Rendering NavItem:", text, "Active:", isActive),
  <li>
    <button className={`cursor-pointer flex items-center gap-4 text-lg w-full  p-2 rounded-lg  hover:bg-violet-500/50 group ${isActive ? "bg-violet-900/70 text-white " : "text-white "}`} onClick={() => onNavigate(route)} >
      <Icon />
      <span className=" whitespace-nowrap">{text}</span>
    </button>
  </li>
);
const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const router = useRouter();
  // Use useCallback for the toggle handler for performance
  const handleToggle = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  const [currentPage, setCurrentPage] = useState<string>('/dashboard');

  // Callback function to handle navigation (simulating router.push)
  const handleNavigate = useCallback((route: string) => {
    setCurrentPage(route);
    router.push(route);
    console.log("Navigating to:", route);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);
  // Navigation items array, explicitly typed with NavItemProps[]
  const navItems: Omit<NavItemProps, 'onNavigate' | 'isActive'>[] = [
    { icon: TokensIcon, text: "My Tokens", route: "/dashboard" },
    { icon: DealsIcon, text: "Deals", route: "/escrows" },
    { icon: HisotryIcon, text: "History", route: "/history" },
    { icon: SettingsIcon, text: "Settings", route: "/setting" },
  ];
  return (
    <aside
      id="default-sidebar"
      className={` z-40 w-64 h-screen transition-transform transform font-mono ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      aria-label="Sidebar"
    >
      <div className="h-full  overflow-y-auto bg-gray-100/10">
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white p-3.5 ">
          Escrow
        </div>
        <ul className="space-y-2 font-medium p-3">
          {navItems.map((item, index) => (
            <NavItem key={index} {...item} onNavigate={handleNavigate}
              isActive={currentPage === item.route} route={item.route} />
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar