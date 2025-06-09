'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Subscribed() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // grab userId from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
     
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);
    } catch (error) {
      console.error('Error parsing token:', error);
      
    }
  }, [router]);

  // fetch followed-users’ auctions
  useEffect(() => {
    const fetchSubscribed = async () => {
      setLoading(true); // Set loading to true before fetching
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/subscribed-auctions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuctions(data);
        } else {
          console.error('Failed to load subscribed auctions:', res.statusText);
          // Handle specific error codes, e.g., if unauthorized, redirect to signin
          if (res.status === 401) {
            router.replace('/signin');
          }
        }
      } catch (error) {
        console.error('Error fetching subscribed auctions:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };
    if (currentUserId !== null) {
      fetchSubscribed();
    }
  }, [currentUserId, router]); // Add router to dependency array as it's used in fetchSubscribed

  // render skeletons
  const renderSkeletons = (count) =>
    Array.from({ length: count }).map((_, i) => (
      <div
        key={`skel-${i}`}
        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse"
      >
        <div className="w-full h-60 bg-gray-200" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    ));

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-5xl mx-auto py-10 px-4 grid gap-6 sm:grid-cols-2">
          {renderSkeletons(10)}
        </div>
      </div>
    );
  }

  // If no auctions are found after loading, display a message
  if (auctions.length === 0 && !loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-5xl mx-auto py-10 px-4 text-center text-gray-600">
          <p>No subscribed auctions found. Follow some users to see their auctions here!</p>
          <Link href="/explore" className="text-blue-600 hover:underline mt-4 block">
            Explore Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-4 grid gap-6 sm:grid-cols-2">
        {auctions.map((auction) => {
          // It's good practice to ensure auction.user and auction.user.Id exist
          const isOwner = auction.user && auction.user.Id === currentUserId;
          return (
            <div
              key={auction.id} // Key should be directly on the iterated element
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <Image
                src={auction.image}
                alt="Auction item"
                width={500}
                height={300}
                className="w-full h-60 object-cover"
              />
              <div className="p-4">
                <p className="text-gray-700 mb-2">{auction.description}</p>
                <div className="text-sm text-gray-500 mb-2">
                  Date Listed: {new Date(auction.dateListed).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Auction End: {new Date(auction.auctionEnd).toLocaleString()}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    ${auction.initialPrice}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      auction.status === 'Open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {auction.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center">
                    <Image
                      src={(auction.user && auction.user.ProfileImage) || '/default.png'}
                      alt={(auction.user && auction.user.Username) || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover mr-3"
                    />
                    <Link
                      href={`/Profile/${auction.user ? auction.user.Id : ''}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {(auction.user && auction.user.Username) || 'Unknown'}
                    </Link>
                  </div>
                  <button
                    onClick={() => router.push(`/Chat/${auction.id}`)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Enter Auction
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}