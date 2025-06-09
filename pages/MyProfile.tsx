'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

const defaultImageUrl =
  'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=';

const Profile = () => {
  const [user, setUser] = useState({
    username: '',
    bio: '',
    profileImage: defaultImageUrl,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setUser({
        username: data.Username || '',
        bio: data.Bio || '',
        profileImage: data.ProfileImage || defaultImageUrl,
      });
    } else {
      console.error('Failed to fetch profile');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: user.username,
        bio: user.bio,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      alert('Profile updated!');
      setIsEditing(false);
      fetchProfile();
    } else {
      alert(result.error || result.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-profile-image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      setUser((prev) => ({ ...prev, profileImage: data.imageUrl }));
    } else {
      alert(data.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
          <div className="relative">
            <img
              src={user.profileImage}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border"
            />
            {isEditing && (
              <input
                type="file"
                onChange={handleImageUpload}
                className="absolute bottom-0 right-0 opacity-0 w-32 h-32 cursor-pointer"
              />
            )}
          </div>

          <div className="mt-4 sm:mt-0 w-full">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile}>
                <input
                  type="text"
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                  className="text-2xl font-bold w-full"
                  placeholder="Username"
                />
                <textarea
                  value={user.bio}
                  onChange={(e) => setUser({ ...user, bio: e.target.value })}
                  className="mt-2 w-full"
                  placeholder="Bio"
                />
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" type="submit">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="ml-2 mt-4 px-4 py-2 bg-gray-300 text-black rounded"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="mt-2 text-gray-600">{user.bio}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
