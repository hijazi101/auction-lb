'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';

const defaultImageUrl =
  'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=';

interface Auction {
  id: number;
  image: string;
  description: string;
  initialPrice: number;
  dateListed: string;
  auctionEnd: string | null;
  isDeleted: boolean;
  status: string | null;
}

const PublicProfile = () => {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState({
    username: '',
    bio: '',
    profileImage: defaultImageUrl,
  });
  const [editedUsername, setEditedUsername] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [auctions, setAuctions] = useState<{
    active: Auction[];
    history: Auction[];
    draft: Auction[];
  }>({
    active: [],
    history: [],
    draft: [],
  });

  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'draft'>('active');

  // ** LOADING STATE **
  const [loading, setLoading] = useState(true);

  // get logged-in user id
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setLoggedInUserId(payload.userId);
      } catch {
        console.error('Invalid token');
      }
    }
  }, []);

  // fetch all profile data + auctions
  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // profile
        const resProfile = await fetch(`/api/public-profile/${id}`);
        if (!resProfile.ok) throw new Error('Failed to fetch profile');
        const data = await resProfile.json();
        setUser({
          username: data.Username || '',
          bio: data.Bio || '',
          profileImage: data.ProfileImage || defaultImageUrl,
        });
        setEditedUsername(data.Username || '');
        setEditedBio(data.Bio || '');
        if (data.auctions) {
          setAuctions({
            active: data.auctions.active || [],
            history: data.auctions.history || [],
            draft: data.auctions.draft || [],
          });
        }

        // subscribers
        const resSubs = await fetch(`/api/subscribers?userId=${id}`);
        const subsData = await resSubs.json();
        setSubscribers(subsData);

        // subscriptions
        const resSups = await fetch(`/api/subscriptions?userId=${id}`);
        const supsData = await resSups.json();
        setSubscriptions(supsData);

        // subscription check
        if (loggedInUserId && loggedInUserId !== Number(id)) {
          const resCheck = await fetch(
            `/api/is-subscribed?subscriberId=${loggedInUserId}&subscribedToId=${id}`
          );
          const chk = await resCheck.json();
          setIsSubscribed(chk.subscribed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, loggedInUserId]);

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscribedToId: Number(id) }),
    });
    const result = await res.json();
    if (res.ok) setIsSubscribed(true);
    else alert(result.message);
  };

  const handleUnsubscribe = async (uid: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscribedToId: uid }),
    });
    if (res.ok) {
      setSubscriptions(subscriptions.filter((u) => u.Id !== uid));
      if (uid === Number(id)) setIsSubscribed(false);
    } else {
      const result = await res.json();
      alert(result.message);
    }
  };

  const handleRemoveSubscriber = async (subscriberId: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscriberId, subscribedToId: loggedInUserId }),
    });
    if (res.ok) {
      setSubscribers(subscribers.filter((s) => s.Id !== subscriberId));
    } else {
      const result = await res.json();
      alert(result.message);
    }
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: editedUsername, bio: editedBio }),
    });
    const result = await res.json();
    if (res.ok) {
      setUser((prev) => ({ ...prev, username: editedUsername, bio: editedBio }));
      setIsEditing(false);
    } else alert(result.message);
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-profile-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) setUser((prev) => ({ ...prev, profileImage: data.imageUrl }));
    else alert(data.message);
  };

  const handleDelete = async (auctionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (!res.ok) throw new Error();
      setAuctions({
        active: auctions.active.filter((a) => a.id !== auctionId),
        history: auctions.history,
        draft: [...auctions.draft, ...auctions.active.filter((a) => a.id === auctionId)],
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not delete auction');
    }
  };

  const handleEdit = (auctionId: number) => {
    router.push(`/Edit/${auctionId}`);
  };

  const isOwner = loggedInUserId === Number(id);

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <div
        key={`skel-${i}`}
        className="bg-gray-100 animate-pulse rounded-lg h-56"
      />
    ));

  const AuctionCard = ({ auction }: { auction: Auction }) => (
    <div className="relative group w-full h-56 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <img src={auction.image} alt="Auction" className="object-cover w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
      <div className="absolute bottom-0 left-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-sm font-medium truncate">{auction.description}</p>
        <p className="text-xs">Price: ${auction.initialPrice}</p>
        {auction.status && <p className="text-xs italic">{auction.status}</p>}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={user.profileImage}
              alt="Profile"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-gray-300"
            />
            {isOwner && isEditing && (
              <input
                type="file"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            )}
          </div>

          {isOwner && isEditing ? (
            <form onSubmit={handleUpdateProfile} className="mt-4 w-full max-w-sm">
              <input
                type="text"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-center text-lg font-semibold"
                placeholder="Username"
              />
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="mt-2 w-full px-3 py-2 border rounded-lg text-center text-sm"
                placeholder="Bio"
              />
              <div className="mt-3 flex justify-center space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedUsername(user.username);
                    setEditedBio(user.bio);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="mt-4 text-2xl font-semibold">{user.username}</h1>
              <p className="mt-2 text-sm text-gray-600 px-4">{user.bio}</p>
              {isOwner ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={isSubscribed ? () => handleUnsubscribe(Number(id)) : handleSubscribe}
                  className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${
                    isSubscribed
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isSubscribed ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwner && (
                <div className="mt-4 flex flex-col sm:flex-row sm:space-x-6 text-sm text-gray-500">
                  <button
                    onClick={() => setShowSubscribers(!showSubscribers)}
                    className="font-semibold text-amber-50"
                  >
                    {subscribers.length} Followers
                  </button>
                  <button
                    onClick={() => setShowSubscriptions(!showSubscriptions)}
                    className="mt-2 sm:mt-0 font-semibold text-amber-50"
                  >
                    {subscriptions.length} Following
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Followers & Subscriptions */}
        {isOwner && showSubscribers && (
          <div className="mt-4 space-y-2 border-t pt-4 relative">
            <button
              onClick={() => setShowSubscribers(false)}
              className="absolute top-0 right-0 mt-1 mr-1 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {subscribers.length ? (
              subscribers.map((follower) => (
                <div
                  key={follower.Id}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                >
                  <span className="text-gray-800">
                    {follower.Username || follower.Email}
                  </span>
                  <button
                    onClick={() => handleRemoveSubscriber(follower.Id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No followers yet.</p>
            )}
          </div>
        )}
        {isOwner && showSubscriptions && (
          <div className="mt-4 space-y-2 border-t pt-4 relative">
            <button
              onClick={() => setShowSubscriptions(false)}
              className="absolute top-0 right-0 mt-1 mr-1 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {subscriptions.length ? (
              subscriptions.map((subscription) => (
                <div
                  key={subscription.Id}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                >
                  <span className="text-gray-800">
                    {subscription.Username || subscription.Email}
                  </span>
                  <button
                    onClick={() => handleUnsubscribe(subscription.Id)}
                    className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded hover:bg-gray-300"
                  >
                    Unfollow
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Not following anyone.</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex justify-center space-x-8">
            <button
              onClick={() => setSelectedTab('active')}
              className={`py-4 px-1 border-b-2 text-sm font-medium ${
                selectedTab === 'active'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setSelectedTab('history')}
                  className={`py-4 px-1 border-b-2 text-sm font-medium ${
                    selectedTab === 'history'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Archive
                </button>
                <button
                  onClick={() => setSelectedTab('draft')}
                  className={`py-4 px-1 border-b-2 text-sm font-medium ${
                    selectedTab === 'draft'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Drafts
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">
          {/* Active */}
          {(selectedTab === 'active' || !isOwner) && (
            <div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {renderSkeletons(6)}
                </div>
              ) : auctions.active.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {auctions.active.map((auction) => (
                    <div key={auction.id} className="space-y-2">
                      <AuctionCard auction={auction} />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => router.push(`/Chat/${auction.id}`)}
                          className="flex-1 px-2 py-1 bg-black text-white text-xs rounded"
                        >
                          Enter
                        </button>
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleEdit(auction.id)}
                              className="flex-1 px-2 py-1 bg-yellow-400 text-black text-xs rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(auction.id)}
                              className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No active auctions.</p>
              )}
            </div>
          )}

          {/* History */}
          {isOwner && selectedTab === 'history' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {renderSkeletons(6)}
                </div>
              ) : auctions.history.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {auctions.history.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No archived auctions.</p>
              )}
            </div>
          )}

          {/* Drafts */}
          {isOwner && selectedTab === 'draft' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {renderSkeletons(6)}
                </div>
              ) : auctions.draft.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {auctions.draft.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No draft auctions.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicProfile;
