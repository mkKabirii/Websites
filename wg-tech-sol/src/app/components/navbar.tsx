"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChartBarSquareIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";
import { Squash as Hamburger } from "hamburger-react";
import { useAuthStore } from "@/zustand/authStore";
import { getServices } from "@/api/module/service";
import { getAllWork } from "@/api/module/work";
import type { OurServiceType } from "../services/types";
import type { WorkCategory } from "../work/types";

// Navbar items type definition
interface NavItem {
  href: string;
  label: string;
  dropdown?: DropdownItem[];
}

interface DropdownItem {
  href: string;
  label: string;
}

const baseNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/process", label: "Process" },
  {
    href: "/blogs",
    label: "Resources",
    dropdown: [
      { href: "/articles", label: "Articles" },
      { href: "/blogs", label: "Blogs" },
      { href: "/events", label: "Events" },
      { href: "/products", label: "Products" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  // { href: "/privacy-policy", label: "Privacy Policy" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function Navbar() {
  const [isOpen, setOpen] = useState(false);
  // const { user } = useAuthStore();
  const { user, clearAuth } = useAuthStore(); // clearAuth bhi add karo
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false); // ✅ NEW
  const profileDropdownRef = useRef<HTMLDivElement>(null); // ✅ NEW
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
    null,
  );
  const [serviceDropdown, setServiceDropdown] = useState<DropdownItem[]>([]);
  const [workDropdown, setWorkDropdown] = useState<DropdownItem[]>([]);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Handle dropdown toggle
  const toggleDropdown = (itemLabel: string) => {
    setOpenDropdown(openDropdown === itemLabel ? null : itemLabel);
  };

  const handleDropdownEnter = (itemLabel: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(itemLabel);
  };

  const handleDropdownLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 160);
  };

  // Handle mobile dropdown toggle
  const toggleMobileDropdown = (itemLabel: string) => {
    setOpenMobileDropdown(openMobileDropdown === itemLabel ? null : itemLabel);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Profile dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [servicesRes, workRes] = await Promise.all([
          getServices(),
          getAllWork(),
        ]);

        const services = Array.isArray(servicesRes?.data?.data)
          ? (servicesRes.data.data as OurServiceType[])
          : [];

        const serviceItems = services
          .flatMap((service) => {
            const serviceLabel = service.title?.trim() || "";
            const serviceSlug = slugify(serviceLabel);
            const subs = Array.isArray(service.subServices)
              ? service.subServices
              : [];

            const serviceLink =
              serviceLabel && serviceSlug
                ? [{ href: `/services#${serviceSlug}`, label: serviceLabel }]
                : [];

            const subLinks = subs
              .map((sub) => {
                const label = sub?.title?.trim() || "";
                const subSlug = slugify(label);
                const anchorId =
                  serviceSlug && subSlug
                    ? `${serviceSlug}-${subSlug}`
                    : subSlug || serviceSlug;
                if (!label || !anchorId) return null;
                return { href: `/services#${anchorId}`, label };
              })
              .filter(Boolean) as DropdownItem[];

            return [...serviceLink, ...subLinks];
          })
          .filter(Boolean) as DropdownItem[];

        const uniqueServiceItems = Array.from(
          new Map(serviceItems.map((item) => [item.href, item])).values(),
        );

        const workCategories: WorkCategory[] =
          (workRes?.data?.data?.works && Array.isArray(workRes.data.data.works)
            ? workRes.data.data.works
            : null) ||
          (workRes?.data?.works && Array.isArray(workRes.data.works)
            ? workRes.data.works
            : null) ||
          (Array.isArray(workRes?.data?.data) ? workRes.data.data : null) ||
          (Array.isArray(workRes?.data) ? workRes.data : []);

        const workItems = workCategories
          .flatMap((category) => {
            const categoryLabel = category.workCategory?.trim() || "";
            const categorySlug = slugify(categoryLabel);
            const works = Array.isArray(category.works) ? category.works : [];

            const categoryLink =
              categoryLabel && categorySlug
                ? [{ href: `/work#${categorySlug}`, label: categoryLabel }]
                : [];

            const workLinks = works
              .map((work) => {
                const label = work?.title?.trim() || "";
                const titleSlug = slugify(label);
                const anchorId =
                  categorySlug && titleSlug
                    ? `${categorySlug}-${titleSlug}`
                    : titleSlug || categorySlug;
                if (!label || !anchorId) return null;
                return { href: `/work#${anchorId}`, label };
              })
              .filter(Boolean) as DropdownItem[];

            return [...categoryLink, ...workLinks];
          })
          .filter(Boolean) as DropdownItem[];

        const uniqueWorkItems = Array.from(
          new Map(workItems.map((item) => [item.href, item])).values(),
        );

        setServiceDropdown(uniqueServiceItems);
        setWorkDropdown(uniqueWorkItems);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdowns();
  }, []);

  const navItems = useMemo(() => {
    return baseNavItems.map((item) => {
      if (item.label === "Services") {
        return {
          ...item,
          dropdown: serviceDropdown.length ? serviceDropdown : undefined,
        };
      }
      if (item.label === "Work") {
        return {
          ...item,
          dropdown: workDropdown.length ? workDropdown : undefined,
        };
      }
      return item;
    });
  }, [serviceDropdown, workDropdown]);

  // const getProfileSrc = (path?: string) =>
  //   path
  //     ? path.startsWith("http")
  //       ? path
  //       : `http://localhost:8003${path}`
  //     : "";

  //new profile src function to handle both absolute and relative URLs
  const getProfileSrc = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://localhost:8003${path}`;
};

const getUserImage = () => {
  return (user as any)?.profilePicture || 
         (user as any)?.profileImage || "";
};

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 sm:h-20 md:h-24 bg-black/70 backdrop-blur border-b border-white/10 ${
          scrolled ? "bg-black/95 backdrop-blur-md shadow-lg" : "bg-black"
        }`}
      >
        <nav className="mx-auto max-w-7xl h-full px-4 flex items-center justify-between">
          {/* Logo + Dashboard (logged-in) */}
          <div className="flex items-center gap-3 z-10">
            <Link
              href="/"
              className="flex items-center justify-center h-[50px] w-[50px] wg-logo"
              aria-label="Home"
            >
              <Image
                src="/images/Logo.png"
                alt="Logo"
                width={500}
                height={500}
                className="h-[50px] w-[50px] object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center space-x-2 xl:space-x-4 z-0">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative dropdown-container"
                onMouseEnter={() =>
                  item.dropdown && handleDropdownEnter(item.label)
                }
                onMouseLeave={() => item.dropdown && handleDropdownLeave()}
              >
                {item.dropdown ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Link
                        href={item.href}
                        className={`px-3 xl:px-5 py-2 xl:py-3 font-semibold rounded-lg transition-all duration-200 text-sm xl:text-base hover:text-[#9EFF00] ${
                          pathname === item.href ||
                          item.dropdown.some(
                            (dropItem) => pathname === dropItem.href,
                          )
                            ? "text-[#9EFF00]"
                            : "text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        aria-label={`${item.label} dropdown`}
                        onClick={() => toggleDropdown(item.label)}
                        className={`p-1 rounded-md transition-all duration-200 hover:text-[#9EFF00] ${
                          openDropdown === item.label
                            ? "text-[#9EFF00]"
                            : "text-white"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 transition-all duration-300 ease-in-out transform ${
                            openDropdown === item.label
                              ? "rotate-180 scale-110"
                              : "rotate-0 scale-100"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {openDropdown === item.label && (
                      <div
                        className="absolute top-full left-0 mt-2 w-56 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-lg py-2 z-50"
                        onMouseEnter={() => handleDropdownEnter(item.label)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {item.dropdown.map((dropItem) => (
                          <Link
                            key={dropItem.href}
                            href={dropItem.href}
                            className={`block px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#9EFF00]/10 hover:text-[#9EFF00] ${
                              pathname === dropItem.href
                                ? "text-[#9EFF00] bg-[#9EFF00]/10"
                                : "text-white"
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {dropItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`px-3 xl:px-5 py-2 xl:py-3 font-semibold rounded-lg transition-all duration-200 text-sm xl:text-base hover:text-[#9EFF00] ${
                      pathname === item.href ? "text-[#9EFF00]" : "text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Privacy Policy and Contact Button */}
          <div className="hidden lg:flex items-center gap-3 z-10">
            {/* <Link
              href="/wgAuthForm"
              className={`px-3 xl:px-4 py-2 xl:py-3 font-semibold rounded-lg transition-all duration-200 text-sm xl:text-base ${
                pathname === "/wgAuthForm"
                  ? "text-[#9EFF00]"
                  : "text-white hover:text-[#9EFF00]"
              }`}
            >
              Login
            </Link> */}
            {/* {user ? (
              <Link
                href="/dashboard"
                className="px-3 xl:px-4 py-2 xl:py-3 font-semibold rounded-lg transition-all duration-200 text-sm xl:text-base text-white hover:text-[#9EFF00]"
              >
                👤 {user.fullname?.split(" ")[0]}
              </Link>
            ) : ( */}
            <Link
              href="/contact"
              className={`px-4 xl:px-5 py-2 xl:py-3 font-semibold rounded-lg transition-all duration-200 text-sm xl:text-base ${
                pathname === "/contact"
                  ? "bg-[#8CE600] text-black ring-2 ring-white"
                  : "bg-[#8CE600] text-black hover:bg-[#9eff00] hover:scale-105"
              }`}
            >
              Contact Us
            </Link>

            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="Open profile menu"
                  className={`h-[50px] w-[50px] rounded-full flex items-center justify-center overflow-hidden border transition-all duration-200 ${
                    profileDropdownOpen
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/15 hover:bg-white/10"
                  }`}
                >
                  {/* {user.profilePicture ? (
                    <img
                      src={getProfileSrc(user.profilePicture)}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="h-full w-full bg-[#9EFF00] text-black font-bold text-base flex items-center justify-center">
                      {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )} */}
                  {getUserImage() ? (
                    <img
                      src={getProfileSrc(getUserImage())}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="h-full w-full bg-[#9EFF00] text-black font-bold text-base flex items-center justify-center">
                      {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {/* <div className="w-10 h-10 rounded-full bg-[#9EFF00] flex items-center justify-center text-black font-bold">
                          {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                        </div> */}
                        <div className="w-10 h-10 rounded-full bg-[#9EFF00] flex items-center justify-center text-black font-bold overflow-hidden">
                          {/* {user.profilePicture ? (
                            <img
                              src={getProfileSrc(user.profilePicture)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          )} */}
                          {getUserImage() ? (
                            <img
                              src={getProfileSrc(getUserImage())}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {user.fullname}
                          </p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    {/* Menu Items */}
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all text-sm"
                    >
                      <ChartBarSquareIcon className="h-5 w-5 text-[#8CE600]" />{" "}
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all text-sm"
                    >
                      <UserIcon className="h-5 w-5 text-[#6366F1]" /> My Account
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/wgAuthForm"
                aria-label="Login"
                className={`h-[50px] w-[50px] rounded-full grid place-items-center font-bold transition-all duration-200 ${
                  pathname === "/wgAuthForm"
                    ? "bg-[#8CE600] text-black ring-2 ring-white"
                    : "bg-[#8CE600] text-black hover:bg-[#9eff00] hover:scale-105"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden z-10">
            <Hamburger
              toggled={isOpen}
              toggle={setOpen}
              color="#fff"
              size={20}
              duration={0.4}
            />
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Now outside of header */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/95 backdrop-blur-md transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Spacer to account for navbar height */}
        <div className="h-[62px] sm:h-[76px] md:h-[93px]"></div>

        <div className="flex flex-col h-[calc(100%-62px)] sm:h-[calc(100%-76px)] md:h-[calc(100%-93px)]">
          <div className="flex-1 overflow-y-auto">
            <div className="flex w-full flex-col justify-center items-stretch px-4 sm:px-6 py-6 space-y-2">
              {navItems.map((item) => (
                <div key={item.href} className="w-full">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => toggleMobileDropdown(item.label)}
                        className={`w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg flex items-center justify-center gap-2 ${
                          pathname === item.href ||
                          item.dropdown.some(
                            (dropItem) => pathname === dropItem.href,
                          )
                            ? "bg-gray-800 text-[#9EFF00]"
                            : "text-white hover:bg-gray-800 active:bg-gray-700"
                        }`}
                      >
                        {item.label}
                        <svg //mobile animated really to be update now
                          // className={`w-4 h-4 transition-transform duration-200 ${
                          //   openMobileDropdown === item.label
                          //     ? "rotate-180"
                          //     : "" }`}
                          //update
                          className={`w-4 h-4 transition-all duration-300 ease-in-out transform ${
                            openMobileDropdown === item.label
                              ? "rotate-180 scale-110 text-[#9EFF00]"
                              : "rotate-0 scale-100"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Mobile Dropdown Items */}
                      {openMobileDropdown === item.label && (
                        <div className=" mt-2 space-y-1 w-full">
                          {item.dropdown.map((dropItem) => (
                            <Link key={dropItem.href} href={dropItem.href}>
                              <div
                                onClick={() => {
                                  setOpen(false);
                                  setOpenMobileDropdown(null);
                                }}
                                className={`w-full flex items-center justify-center text-left py-2 sm:py-3 font-medium rounded-lg transition-all duration-200 text-sm sm:text-base ${
                                  pathname === dropItem.href
                                    ? "text-[#9EFF00]"
                                    : "text-gray-300 hover:bg-gray-700 active:bg-gray-600"
                                }`}
                              >
                                {dropItem.label}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // href={item.href}
                    <Link href={item.href}>
                      <div
                        onClick={() => setOpen(false)}
                        className={`w-full  flex items-center justify-center text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg ${
                          pathname === item.href
                            ? "bg-gray-800 text-[#9EFF00]"
                            : "text-white hover:bg-gray-800 active:bg-gray-700"
                        }`}
                      >
                        {item.label}
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Privacy Policy and Contact Button */}
          <div className="px-4 sm:px-6 pb-6 space-y-3">
            {/* <Link
              href="/wgAuthForm"
              onClick={() => setOpen(false)}
              className={`block w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg ${
                pathname === "/wgAuthForm"
                  ? "bg-gray-800 text-[#9EFF00]"
                  : "text-white hover:bg-gray-800 active:bg-gray-700"
              }`}
            >
              Login
            </Link> */}
            {/* {user ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg text-white hover:bg-gray-800"
              >
                👤 {user.fullname?.split(" ")[0]}
              </Link>
            ) : ( */}

            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className={`block w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg ${
                pathname === "/contact"
                  ? "bg-[#9EFF00] text-black ring-2 ring-white"
                  : "bg-[#9EFF00] text-black hover:bg-[#8CE600] active:bg-[#7CD600]"
              }`}
            >
              Contact Us
            </Link>

            {user ? (
              <div className="w-full space-y-2">
                {/* User Info */}
                <div className="flex items-center gap-3 py-3 px-4 bg-[#1a1a1a] rounded-lg">
                  {/* <div className="w-10 h-10 rounded-full bg-[#9EFF00] flex items-center justify-center text-black font-bold">
                    {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                  </div> */}
                  <div className="w-10 h-10 rounded-full bg-[#9EFF00] flex items-center justify-center text-black font-bold overflow-hidden">
                    {/* {user.profilePicture ? (
                      <img
                        src={`http://localhost:8003${user.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )} */}
                    {getUserImage() ? (
                      <img
                        src={getProfileSrc(getUserImage())}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">
                      {user.fullname}
                    </p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-white hover:bg-gray-800 text-base flex items-center justify-center gap-2"
                >
                  <UserIcon className="h-5 w-5 text-[#6366F1]" /> My Account
                </Link>
                <Link
                  href="/dashboard/chat"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-white hover:bg-gray-800 text-base flex items-center justify-center gap-2"
                >
                  <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 text-[#8CE600]" />{" "}
                  Chat with Admin
                </Link>
                <Link
                  href="/dashboard/proposals"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-white hover:bg-gray-800 text-base flex items-center justify-center gap-2"
                >
                  <DocumentTextIcon className="h-5 w-5 text-[#FBBF24]" /> My
                  Proposals
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-white hover:bg-gray-800 text-base flex items-center justify-center gap-2"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-[#A3A3A3]" /> Settings
                </Link>
                {/* <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-white hover:bg-gray-800 text-base"
                >
                  📊 Dashboard
                </Link> */}
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    clearAuth();
                    setOpen(false);
                    window.location.href = "/";
                  }}
                  className="block w-full text-center py-3 font-semibold rounded-lg text-red-400 hover:bg-gray-800 text-base flex items-center justify-center gap-2"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-[#FBBF24]" />{" "}
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/wgAuthForm"
                onClick={() => setOpen(false)}
                // className={`block w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg ${
                //   pathname === "/wgAuthForm"
                //     ? "bg-gray-800 text-[#9EFF00]"
                //     : "text-white hover:bg-gray-800 active:bg-gray-700"
                // }`}

                className={`block w-full text-center py-3 sm:py-4 font-semibold rounded-lg transition-all duration-200 text-base sm:text-lg ${
                  pathname === "/wgAuthForm"
                    ? "bg-[#9EFF00] text-black ring-2 ring-white"
                    : "bg-[#9EFF00] text-black hover:bg-[#8CE600] active:bg-[#7CD600]"
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
