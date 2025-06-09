'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';
import Navbar from '../components/Navbar'
function timeAgo(fromDateString) {
  const then = new Date(fromDateString).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found; cannot fetch notifications');
          setLoading(false);
          return;
        }

        const resp = await fetch('/api/notifications', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resp.ok) {
          console.error('Failed to fetch notifications');
          setLoading(false);
          return;
        }

        const data = await resp.json();
        setNotifications(data.notifications);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  if (loading) {
    return <div>Loading notifications…</div>;
  }

  if (notifications.length === 0) {
    return <div>No notifications yet.</div>;
  }

  return (
    <> 
    <Navbar/>
    <div className="space-y-4">
      {notifications.map((notif) => {
        let payload;
        try {
          payload = JSON.parse(notif.message);
        } catch (e) {
          console.error('Could not parse notification.message as JSON:', notif.message);
          return null;
        }

        return (
          <div
            key={notif.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm"
          >
            <img
              src={payload.profileImage}
              alt={payload.username}
              className="w-10 h-10 rounded-full object-cover border"
            />

            <div className="flex-1">
              {notif.type === 'follow' ? (
                <p className="text-gray-800">
                  <a
                    href={`/profile/${payload.userId}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {payload.username}
                  </a>{' '}
                  started following you.
                </p>
              ) : notif.type === 'win' ? (
                <p className="text-gray-800">
                  You won the auction: <span className="font-semibold">{payload.auctionTitle}</span> 
                  with a price of <span className="font-semibold">${payload.winningPrice}</span>
                </p>
              ) : notif.type === 'auction_win' ? (
                <p className="text-gray-800">
                  Your auction <span className="font-semibold">{payload.auctionTitle}</span> was won by{' '}
                  <a
                    href={`/profile/${payload.userId}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {payload.username}
                  </a> with a price of <span className="font-semibold">${payload.winningPrice}</span>
                </p>
              ) : (
                <p className="text-gray-800">
                  <a
                    href={`/profile/${payload.userId}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {payload.username}
                  </a>{' '}
                  created a new auction.
                </p>
              )}
              <p className="text-gray-500 text-sm">{timeAgo(notif.createdAt)}</p>
            </div>

            {notif.type !== 'follow' && (
              <button
                onClick={() => router.push(`/Auction/${payload.auctionId}`)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Show Auction
              </button>
            )}
          </div>
        );
      })}
    </div>
     </>
  );
}