'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '@/app/globals.css';

export default function SearchPage() {
  // State variables remain unchanged
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Updated handleSearch: it now accepts a search term string instead of an event
  const handleSearch = async (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Unknown error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-4 px-4">
      {/* TikTok-style header */}
      <div className="sticky top-0 bg-black z-10 pt-2 pb-3">
        <h1 className="text-xl font-bold text-white mb-5 text-center">
          Discover
        </h1>

        {/* Search Form with left arrow */}
        <form className="flex items-center mx-auto mb-6 px-4">
          {/* Left arrow linking back to home, placed just to the left of the input */}
          <Link href="/">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-white text-xl mr-3"
            />
          </Link>

          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="text-gray-400 text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Search accounts"
              value={term}
              onChange={(e) => {
                const value = e.target.value;
                setTerm(value);
                handleSearch(value);
              }}
              className="w-full bg-gray-800 text-white rounded-full px-10 py-3 focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-400"
            />
            {term && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => {
                  setTerm('');
                  setResults([]);
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-gray-400 text-sm"
                />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-auto text-red-500 mb-4 text-center text-sm">
          {error}
        </div>
      )}

      {/* Loading Spinner - TikTok style */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Results Grid - TikTok style */}
      <div className="grid grid-cols-3 gap-2 px-2 pb-20">
        {results.map((user) => (
          <Link
            key={user.Id}
            href={`/Profile/${user.Id}`}
            className="block"
          >
            <div className="flex flex-col items-center">
              {/* Profile Image - Circular with TikTok gradient */}
              <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-purple-700 via-red-500 to-amber-500">
                {user.ProfileImage ? (
                  <div className="bg-black rounded-full p-[2px]">
                    <Image
                      src={user.ProfileImage}
                      alt={user.Username || 'User'}
                      width={88}
                      height={88}
                      className="rounded-full object-cover border-2 border-black"
                    />
                  </div>
                ) : (
                  <div className="w-22 h-22 bg-gray-800 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-xl font-bold text-white">
                      {user.Username ? user.Username.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Username */}
              <p className="text-white font-semibold mt-2 text-sm truncate max-w-[90px]">
                @{user.Username || '—'}
              </p>

              {/* Followers count - TikTok style */}
              <p className="text-gray-400 text-xs mt-1">
                {user.followerCount >= 1000
                  ? `${(user.followerCount / 1000).toFixed(1)}k`
                  : user.followerCount
                } followers
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* No results message */}
      {!loading && term.trim() && results.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          <p className="text-lg">No accounts found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try searching for something else
          </p>
        </div>
      )}
    </div>
  );
}
