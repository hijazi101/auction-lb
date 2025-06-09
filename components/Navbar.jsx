'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faBell,
  faStar,
  faBox,
  faUser,
  faSignOutAlt,
  faSignInAlt,
    faSearch, // import search icon
} from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';  // Corrected import

import '@/app/globals.css';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      try {
        const decoded = jwtDecode(token);  // Now works correctly
        setUserId(decoded.userId);
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/signin');
  };

  return (
    <nav className="bg-gray-100 text-gray-800 py-4 px-6 flex justify-between items-center border-b border-gray-200">
      {/* Left: Profile */}
      <div className="flex items-center">
        {userId ? (
          <Link href={`/Profile/${userId}`} className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500">
            <FontAwesomeIcon icon={faUser} size="lg" />
          </Link>
        ) : (
          <div className="p-2 text-gray-400">
            <FontAwesomeIcon icon={faUser} size="lg" />
          </div>
        )}
      </div>

      {/* Center: Main nav links */}
      <div className="flex items-center space-x-6 md:space-x-8">
        <Link href="/" className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500">
          <FontAwesomeIcon icon={faHouse} size="lg" />
        </Link>
        <Link href="/Notification" className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500">
          <FontAwesomeIcon icon={faBell} size="lg" />
        </Link>
        <Link href="/Subscribed" className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500">
          <FontAwesomeIcon icon={faStar} size="lg" />
        </Link>
      </div>

      {/* Right: Orders and Auth */}
      <div className="flex items-center space-x-6">
          <Link
          href="/Search"
          className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500"
          title="Search"
        >
          <FontAwesomeIcon icon={faSearch} size="lg" />
        </Link>
        <Link href="/My_orders" className="p-2 inline-flex items-center text-gray-800 hover:text-blue-500">
          <FontAwesomeIcon icon={faBox} size="lg" />
        </Link>

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:text-red-800"
            title="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} size="lg" />
          </button>
        ) : (
          <Link href="/signin" className="p-2 text-blue-600 hover:text-blue-800" title="Sign In">
            <FontAwesomeIcon icon={faSignInAlt} size="lg" />
          </Link>
        )}
      </div>
    </nav>
  );
}
