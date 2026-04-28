"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getServices } from "@/api/module/service";
import { getAllWork } from "@/api/module/work";
import type { OurServiceType } from "../services/types";
import type { WorkCategory } from "../work/types";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// TypeScript interface definition
interface NavItem {
  href: string;
  label: string;
  dropdown?: DropdownItem[];
}

interface DropdownItem {
  href: string;
  label: string;
}

export default function Footer() {
  const pathname = usePathname();
  // TypeScript state for dropdown management
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [serviceDropdown, setServiceDropdown] = useState<DropdownItem[]>([]);
  const [workDropdown, setWorkDropdown] = useState<DropdownItem[]>([]);

  // TypeScript function to handle dropdown toggle
  const toggleDropdown = (itemHref: string) => {
    setOpenDropdown(openDropdown === itemHref ? null : itemHref);
  };

  // TypeScript useEffect for outside click detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const navItems: NavItem[] = [
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
  ];

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

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
          .map((service) => {
            const label = service.title?.trim() || "";
            const slug = slugify(label);
            if (!label || !slug) return null;
            return { href: `/services#${slug}`, label };
          })
          .filter(Boolean) as DropdownItem[];

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
          .map((category) => {
            const label = category.workCategory?.trim() || "";
            const slug = slugify(label);
            if (!label || !slug) return null;
            return { href: `/work#${slug}`, label };
          })
          .filter(Boolean) as DropdownItem[];

        setServiceDropdown(serviceItems);
        setWorkDropdown(workItems);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdowns();
  }, []);

  const resolvedNavItems = navItems.map((item) => {
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

  return (
    <footer className="w-auto h-auto min-h-[335px] flex flex-col justify-between py-10 px-2 md:px-6 lg:px-10">
      {/* Top row: becomes column by default; row at 1405px+ */}
      <div className="flex flex-col min-[1405px]:flex-row items-center justify-between gap-8">
        <Link href="/">
          <div className="flex flex-col items-center mb-4 min-[1405px]:mb-0 ">
            <div className="flex items-center justify-center">
              <Image
                src="/images/Logo.png"
                alt="Logo"
                width={100}
                height={80}
                className="p-2"
              />
            </div>
            <span className="text-white text-xl md:text-2xl font-semibold sm:mt-0">
              WGTECSOL (Pvt.) Ltd.
            </span>
          </div>
        </Link>

        <nav className="flex flex-wrap justify-center gap-4 md:gap-8">
          {resolvedNavItems.map((item) => (
            <div
              key={item.href}
              className="relative group"
              ref={item.dropdown ? dropdownRef : null}
              onMouseEnter={() => item.dropdown && setOpenDropdown(item.href)}
              onMouseLeave={() => item.dropdown && setOpenDropdown(null)}
            >
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.href)}
                    className={`md:text-lg hover:text-lime-400 transition-colors duration-200 flex items-center gap-1 ${
                      pathname === item.href ||
                      item.dropdown.some(
                        (dropItem) => pathname === dropItem.href,
                      )
                        ? "text-lime-400"
                        : "text-white"
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${
                        openDropdown === item.href ? "rotate-180" : ""
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

                  {/* Dropdown Menu - Click based */}
                  {openDropdown === item.href && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-lg py-2 z-50 opacity-100 visible transition-all duration-200">
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.href}
                          href={dropItem.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 ${
                            pathname === dropItem.href
                              ? "text-lime-400 bg-white/5"
                              : "text-white hover:text-lime-400"
                          }`}
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
                  className={`md:text-lg hover:text-lime-400 transition-colors duration-200 ${
                    pathname === item.href ? "text-lime-400" : "text-white"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Stay Connected: always single line, no wrap */}
        <div className="flex flex-nowrap items-center rounded-xl border border-[#232323] px-3 py-2 md:px-3 md:py-4 gap-3 md:gap-6 mt-4 min-[1405px]:mt-0 max-w-auto overflow-x-auto">
          <span className="text-sm md:text-lg whitespace-nowrap">
            Stay Connected
          </span>
          <div className="flex flex-nowrap items-center gap-2 md:gap-4">
            <a
              href="https://www.facebook.com/share/177gkQZKYB/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] rounded-lg w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-lime-400 transition group shrink-0"
              aria-label="Facebook"
            >
              <FaFacebookF className="text-lime-400 text-lg md:text-2xl transition group-hover:text-black" />
            </a>
            <a
              href="https://www.instagram.com/wgtecsol?igsh=anQzb251Y2d3NjY1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] rounded-lg w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-lime-400 transition group shrink-0"
              aria-label="Instagram"
            >
              <FaInstagram className="text-lime-400 text-lg md:text-2xl transition group-hover:text-black" />
            </a>
            <a
              href="https://x.com/WGTecSol"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] rounded-lg w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-lime-400 transition group shrink-0"
              aria-label="LinkedIn"
            >
              <FaXTwitter className="text-lime-400 text-lg md:text-2xl transition group-hover:text-black" />
            </a>
            <a
              href="https://www.linkedin.com/company/wgtecsol-bilawalayoub/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] rounded-lg w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-lime-400 transition group shrink-0"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn className="text-lime-400 text-lg md:text-2xl transition group-hover:text-black" />
            </a>
            <a
              href="https://wa.me/923292125592"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#232323] rounded-lg w-9 h-9 md:w-12 md:h-12 flex items-center justify-center hover:bg-lime-400 transition group shrink-0"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="text-lime-400 text-lg md:text-2xl transition group-hover:text-black" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[#232323] my-6"></div>

      {/* Bottom row: becomes column on lg screens */}
      <div className="flex flex-col my-4 lg:flex-row justify-between items-center lg:items-center gap-4 mb-8 lg:w-full xl:w-1/2">
        {/* Email */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-auto justify-center lg:justify-start border-b border-[#232323] pb-5">
          <FaEnvelope className="text-lime-400 text-lg shrink-0" />
          <span className="text-white text-sm md:text-base font-medium">
            <Link
              href="info@wgtecsol.com"
              aria-label="Email info@wgtecsol.com"
              className="transition-colors duration-150 lg:hover:underline focus-visible:underline"
            >
              info@wgtecsol.com
            </Link>
          </span>
        </div>

        {/* Phone (centered) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-auto justify-center lg:justify-start border-b border-[#232323] pb-5">
          <FaPhoneAlt className="text-lime-400 text-lg shrink-0" />
          {/* <span className="flex flex-col text-white text-sm md:text-base font-medium text-center whitespace-nowrap"> */}
          <Link
            href="https://wa.me/923292125592"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 lg:hover:text-lime-400 lg:hover:underline focus-visible:underline"
          >
            +923292125592
          </Link>

          {/* <Link
                            href="https://wa.me/923319991156"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors duration-150 lg:hover:text-lime-400 lg:hover:underline focus-visible:underline"
                        >
                          
                        </Link> */}
          {/* </span> */}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-auto justify-center lg:justify-start border-b border-[#232323] pb-5">
          <FaMapMarkerAlt className="text-lime-400 text-lg shrink-0" />
          <span className="text-white text-sm md:text-base font-medium whitespace-nowrap">
            Serving Worldwide
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-xs md:text-sm">
        <div className="text-center sm:text-left">
          © 2025 WGTECSOL (Pvt.) Ltd. All rights reserved.{" "}
          <Link
            href="/privacy-policy"
            className={`text-[#9EFF00] hover:text-[#9EFF00]/80 underline font-bold ${
              pathname === "/privacy-policy" ? "text-lime-400" : ""
            }`}
          >
            Privacy Policy
          </Link>
        </div>
        <div className="flex items-center gap-4 sm:gap-6"></div>
      </div>
    </footer>
  );
}
