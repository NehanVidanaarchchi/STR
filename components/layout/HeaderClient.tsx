"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { usePathname } from "next/navigation";

type headerClientProps = {
  isLoggedIn: boolean;
};

export default function headerClient({ isLoggedIn }: headerClientProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setProfileOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04),0_4px_6px_-4px_rgba(0,0,0,0.04)]">
      <div className="container mx-auto flex items-center justify-between py-2 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/STR_logo.jpg"
            alt="STR Marketplace Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-6">{/* ... */}</nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center space-x-6">
          {/* List Your Product */}
 {!isLoggedIn && (
            <Link
              href="/home/list-your-product"
              className="text-md font-semibold text-[#2B6CB0] hover:text-blue-800"
            >
              List Your Product
            </Link>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center"
            >
              <span className="text-gray-700">👤</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border">
                {!isLoggedIn ? (
                  // ✅ when NOT logged in
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    Login
                  </Link>
                ) : (
                  // ✅ when logged in
                  <>
                    {/* <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Admin
                    </Link> */}

                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Provider Dashboard
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-800 text-2xl"
          onClick={() => setNavOpen(!navOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {navOpen && (
        <div className="md:hidden border-t bg-white px-2 py-4 space-y-3">
          <Link
            href="/home/list-your-product"
            className="block font-semibold text-[#2B6CB0]"
          >
            List Your Product
          </Link>

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="block w-full text-left text-gray-700"
          >
            <User />
          </button>

          {profileOpen && (
            <div className="mt-2 border rounded bg-white">
              {!isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => setProfileOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    Provider Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
