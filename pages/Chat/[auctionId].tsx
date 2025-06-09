'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function ChatPage() {
  const router = useRouter();
  const { auctionId } = router.query;

  const [auction, setAuction] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [winnerName, setWinnerName] = useState(''); 
  const [endedChecked, setEndedChecked] = useState(false); 
  const [isEnded, setIsEnded] = useState(false); 

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const email = localStorage.getItem('email');
      const savedToken = localStorage.getItem('token');
      if (!email || !savedToken) {
        router.push('/Signin');
        return;
      }
      setUserEmail(email);
      setToken(savedToken);

      try {
        const res = await fetch(`/api/user/by-email?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        setUserId(data.id);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user info');
      }
    };
    fetchUserData();
  }, [router]);

  // Redirect if auction ended in another tab
  useEffect(() => {
    function onStorageEvent(e: StorageEvent) {
      if (e.key === `auctionEnded_${auctionId}`) {
        alert('Auction ended – redirecting to home page');
        router.push('/?msg=auction-ended');
      }
    }
    window.addEventListener('storage', onStorageEvent);
    return () => window.removeEventListener('storage', onStorageEvent);
  }, [auctionId, router]);

  // If already ended, redirect immediately
  useEffect(() => {
    if (!auctionId) return;
    const endedFlag = localStorage.getItem(`auctionEnded_${auctionId}`);
    if (endedFlag) {
      alert('Auction ended – redirecting to home page');
      router.push('/?msg=auction-ended');
    }
  }, [auctionId, router]);

  // Core fetch of auction + all messages
  const fetchAuctionAndMessages = useCallback(async () => {
    if (!auctionId) return;
    try {
      const [auctionRes, messagesRes] = await Promise.all([
        fetch(`/api/auctions/${auctionId}`),
        fetch(`/api/messages/${auctionId}`)
      ]);
      if (!auctionRes.ok) throw new Error('Failed to fetch auction data');
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const auctionData = await auctionRes.json();
      const messagesData = await messagesRes.json();
      setAuction(auctionData);
      setMessages(messagesData);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Initial load
  useEffect(() => {
    fetchAuctionAndMessages();
  }, [fetchAuctionAndMessages]);

  // —— NEW: Poll for new messages every 2 seconds ——
  useEffect(() => {
    if (!auctionId) return;
    const interval = setInterval(() => {
      // Only fetch messages (could optimize to a separate endpoint)
      fetch(`/api/messages/${auctionId}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(msgs => setMessages(msgs))
        .catch(err => console.error('Polling error:', err));
    }, 2000);
    return () => clearInterval(interval);
  }, [auctionId]);

  // Compute winner when end time passes
  useEffect(() => {
    if (!auction || messages.length === 0 || endedChecked) return;
    if (auction.auctionEnd) {
      const endTime = new Date(auction.auctionEnd);
      if (Date.now() >= endTime.getTime()) {
        let highestBid = parseFloat(auction.initialPrice);
        let winnerUser: any = null;
        messages.forEach(msg => {
          const val = parseFloat(msg.content);
          if (!isNaN(val) && val > highestBid) {
            highestBid = val;
            winnerUser = msg.user;
          }
        });
        setWinnerName(winnerUser ? (winnerUser.Username || 'Unknown') : 'No bids placed');
        setEndedChecked(true);
        setIsEnded(true);
      }
    }
  }, [auction, messages, endedChecked]);

  // After showing winner screen, redirect
  useEffect(() => {
    if (!isEnded) return;
    const timer = setTimeout(() => {
      router.push('/?msg=auction-ended');
    }, 5000);
    return () => clearTimeout(timer);
  }, [isEnded, router]);

  // Helpers: owner check, bid calculations, validation...
  const isAuctionOwner = auction?.user?.Email === userEmail;
  const getUserMaxBid = () => {
    if (!userId) return 0;
    const bids = messages
      .filter(m => m.user?.Id === userId)
      .map(m => parseFloat(m.content))
      .filter(n => !isNaN(n));
    return bids.length ? Math.max(...bids) : 0;
  };
  const getHighestBid = () => {
    const bids = messages
      .map(m => parseFloat(m.content))
      .filter(n => !isNaN(n));
    const base = auction ? parseFloat(auction.initialPrice) : 0;
    return bids.length ? Math.max(...bids) : base;
  };
  const validateBid = (bidValue: string): string | null => {
    if (!auction) return 'Auction data not loaded';
    if (isAuctionOwner) return 'Owner cannot bid';
    const num = parseFloat(bidValue);
    if (isNaN(num)) return 'Enter a valid number';
    if (num <= 0) return 'Must be positive';
    const userMax = getUserMaxBid();
    const highest = getHighestBid();
    if (auction.status === 'Closed') {
      if (num <= parseFloat(auction.initialPrice))
        return `Must be > initial price ($${parseFloat(auction.initialPrice).toFixed(2)})`;
      if (num <= userMax)
        return `Must be > your previous bid ($${userMax.toFixed(2)})`;
    } else {
      if (num <= parseFloat(auction.initialPrice))
        return `Must be > initial price ($${parseFloat(auction.initialPrice).toFixed(2)})`;
      if (num <= highest)
        return `Must be > current highest ($${highest.toFixed(2)})`;
    }
    return null;
  };

  // Send a new bid
  const handleSendMessage = async () => {
    if (!userId) {
      setError('Please sign in to bid');
      return;
    }
    const errMsg = validateBid(newMessage);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    try {
      const res = await fetch(`/api/messages/${auctionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          auctionId: Number(auctionId),
          content: parseFloat(newMessage).toFixed(2),
          auctionStatus: auction.status,
        }),
      });
      if (!res.ok) {
        const { error: apiErr } = await res.json();
        setError(apiErr || 'Failed to place bid');
        return;
      }
      setNewMessage('');
      setError('');
      // immediate refresh of messages
      fetch(`/api/messages/${auctionId}`)
        .then(r => r.json())
        .then(setMessages)
        .catch(console.error);
    } catch (err: any) {
      console.error('Bid error:', err);
      setError(err.message);
    }
  };

  // Close auction handler (owner only)
  const handleCloseAuction = async () => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ auctionEnd: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to close auction');
        return;
      }
      localStorage.setItem(`auctionEnded_${auctionId}`, Date.now().toString());
      fetchAuctionAndMessages();
    } catch (err) {
      console.error(err);
      setError('Failed to close auction');
    }
  };

  const calculateMinimumBid = () => {
    if (!auction) return 0;
    const init = parseFloat(auction.initialPrice);
    const userMax = getUserMaxBid();
    const highest = getHighestBid();
    return (auction.status === 'Closed'
      ? Math.max(init, userMax)
      : Math.max(init, highest)) + 0.01;
  };

  // Render states
  if (loading) return <div className="p-6">Loading...</div>;
  if (!auction) return <div className="p-6">Auction not found</div>;

  if (isEnded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Auction Ended</h1>
        <p className="text-xl">
          Winner: <span className="font-semibold">{winnerName}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Redirecting to home in 5 seconds...
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        {/* Auction info */}
        <h1 className="text-xl font-bold mb-4">Auction Chat Room</h1>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <Image
              src={auction.user?.ProfileImage || '/default.png'}
              alt="User"
              width={48}
              height={48}
              className="rounded-full object-cover mr-4"
            />
            <div>
              <p className="text-lg font-semibold">
                {auction.user?.Username || 'Unknown User'}
              </p>
              <p className="text-sm text-gray-500">
                Listed: {new Date(auction.dateListed).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Image
            src={auction.image}
            alt="Auction"
            width={800}
            height={400}
            className="w-full h-60 object-cover mb-4 rounded"
          />
          <p className="text-gray-800 mb-2">{auction.description}</p>
          <p className="text-gray-600 mb-1">
            Initial Price: ${parseFloat(auction.initialPrice).toFixed(2)}
          </p>
          <p
            className={`text-sm ${
              auction.status === 'Open' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            Status: {auction.status.toUpperCase()}
          </p>
          {isAuctionOwner && (
            <button
              onClick={handleCloseAuction}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close Auction
            </button>
          )}
        </div>

        {/* Chat / bidding panel */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-lg font-semibold mb-2">Bidding</h2>
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {messages.map((msg) => {
              const bidAmount = parseFloat(msg.content);
              const isClosed = auction.status === 'Closed';
              const isOwnBid = msg.user?.Id === userId;
              if (isClosed && !isOwnBid && !isAuctionOwner) {
                return (
                  <div
                    key={msg.id}
                    className="flex justify-end opacity-30 italic text-gray-500 max-w-xs break-words"
                  >
                    <span>Hidden Bid</span>
                  </div>
                );
              }
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isOwnBid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`${
                      isOwnBid ? 'bg-blue-100' : 'bg-gray-100'
                    } text-black p-3 rounded-lg max-w-xs break-words`}
                  >
                    $
                    {!isNaN(bidAmount)
                      ? bidAmount.toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex space-x-2">
            {isAuctionOwner ? (
              <div className="flex-grow border px-3 py-2 rounded bg-gray-100 text-gray-500">
                Owner View Mode - All bids visible
              </div>
            ) : (
              <>
                <input
                  type="number"
                  placeholder={`Enter bid (min $${calculateMinimumBid().toFixed(
                    2
                  )})`}
                  className="flex-grow border px-3 py-2 rounded text-black"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={
                    auction.status === 'Closed' && getUserMaxBid() > 0
                  }
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={
                    auction.status === 'Closed' && getUserMaxBid() > 0
                  }
                >
                  Bid
                </button>
              </>
            )}
          </div>

          {error && <p className="text-red-600 mt-2">{error}</p>}

          {isAuctionOwner ? (
            <p className="text-blue-600 mt-2">
              Auction owner view mode: You can see all bids but cannot participate
            </p>
          ) : (
            auction.status === 'Closed' &&
            getUserMaxBid() === 0 && (
              <p className="text-red-600 mt-2">
                Auction closed. You cannot place a bid because you never bid before.
              </p>
            )
          )}
        </div>
      </div>
    </>
  );
}
