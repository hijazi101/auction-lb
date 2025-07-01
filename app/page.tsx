'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const CATEGORY_LIST = [
    'vehicles',
    'jewelry',
    'properties',
    'electronics',
    'decor',
    'antika',
    'industrial',
    'pets and animals',
    'sports',
    'jobs',
    'fashion',
    'services',
    'others',
  ];

  async function uploadImage(base64Image: string) {
    return base64Image;
  }

  async function uploadImages(base64Images: string[]) {
    return base64Images;
  }

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');

      let imageUrls: string[] = [];
      if (Array.isArray(data.images)) {
        imageUrls = await uploadImages(data.images);
      } else if (typeof data.images === 'string') {
        imageUrls = [await uploadImage(data.images)];
      }

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          image: imageUrls,
          initialPrice: parseFloat(data.initialPrice),
          auctionEnd: data.auctionEnd,
          isClosed: data.isClosed === 'true',
          category: data.category,
        }),
      });

      if (!response.ok) throw new Error('Failed to create auction');

      const newAuction = await response.json();
      setAuctions((prev) => [newAuction, ...prev]);
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/signin');
        setLoading(false);
        return;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);
      setAuthenticated(true);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/auctions?search=`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setAuctions(data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (authenticated) fetchAuctions();
  }, [authenticated]);

  const renderSkeletons = (count: number) =>
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

  const currentTime = new Date();

  const filteredAuctions = auctions
    .filter((auction) => {
      const hasValidEndTime =
        auction.auctionEnd && new Date(auction.auctionEnd) > currentTime;
      return hasValidEndTime && auction.isDeleted === false;
    })
    .filter((auction) =>
      auction.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((auction) =>
      selectedCategory ? auction.category === selectedCategory : true
    )
    .filter((auction) => {
      const price = parseFloat(auction.initialPrice.toString());
      if (minPrice && price < parseFloat(minPrice)) return false;
      if (maxPrice && price > parseFloat(maxPrice)) return false;
      return true;
    });

  filteredAuctions.sort((a, b) => {
    const dateA = new Date(a.dateListed).getTime();
    const dateB = new Date(b.dateListed).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auctions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (!response.ok) throw new Error('Failed to delete auction');
      setAuctions((prev) =>
        prev.map((auction) =>
          auction.id === id ? { ...auction, isDeleted: true } : auction
        )
      );
    } catch {
      console.error('Delete error');
      setErrorMessage('Could not delete auction');
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/Edit/${id}`);
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleMultipleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);

    Promise.all(
      filesArray.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
              else reject('FileReader result is not string');
            };
            reader.onerror = () => reject('Error reading file');
            reader.readAsDataURL(file);
          })
      )
    )
      .then((base64Images) => {
        setValue('images', base64Images, { shouldValidate: true });
      })
      .catch(() => {
        setErrorMessage('Error processing images');
      });
  };

  // New: Track current carousel index per auction
  const [carouselIndexes, setCarouselIndexes] = useState<Record<number, number>>({});

  const prevImage = (auctionId: number, imagesLength: number) => {
    setCarouselIndexes((prev) => {
      const currentIndex = prev[auctionId] ?? 0;
      return {
        ...prev,
        [auctionId]: currentIndex === 0 ? imagesLength - 1 : currentIndex - 1,
      };
    });
  };

  const nextImage = (auctionId: number, imagesLength: number) => {
    setCarouselIndexes((prev) => {
      const currentIndex = prev[auctionId] ?? 0;
      return {
        ...prev,
        [auctionId]: currentIndex === imagesLength - 1 ? 0 : currentIndex + 1,
      };
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Auction Listings</h1>

      <div className="flex items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search auctions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Filters
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Auction
        </button>
      </div>

      {showFilters && (
        <>
          <div className="flex space-x-2 overflow-x-auto py-2 mb-4">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory((prev) => (prev === cat ? '' : cat))
                }
                className={`whitespace-nowrap px-3 py-1 border rounded-full text-sm font-medium ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Min Price:</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Max Price:</label>
              <input
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Sort by Date:</label>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as 'desc' | 'asc')
                }
                className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-auto">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-4">
            <Dialog.Title className="text-lg font-semibold mb-3">
              Create New Auction
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-black">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Choose Images (one or more)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageChange}
                  className="w-full border rounded-lg px-2 py-1"
                />
                <input
                  type="hidden"
                  {...register('images', { required: 'At least one image is required' })}
                />
                {errors.images && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.images.message}
                  </p>
                )}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((file, idx) => {
                      const objectUrl = URL.createObjectURL(file);
                      return (
                        <img
                          key={idx}
                          src={objectUrl}
                          alt={`preview-${idx}`}
                          className="h-16 w-16 object-cover rounded"
                          onLoad={() => URL.revokeObjectURL(objectUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Minimum 10 characters',
                    },
                  })}
                  className="w-full border rounded-lg px-2 py-1"
                  rows={2}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  {...register('category', {
                    required: 'Category is required',
                  })}
                  className="w-full border rounded-lg px-2 py-1"
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    {...register('initialPrice', {
                      required: 'Price is required',
                      min: { value: 1, message: 'Min $1' },
                    })}
                    className="w-full border rounded-lg px-2 py-1"
                  />
                  {errors.initialPrice && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.initialPrice.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date & Time
                  </label>
                  <input
                    name="auctionEnd"
                    type="datetime-local"
                    {...register('auctionEnd', {
                      required: 'End time is required',
                      validate: (value) =>
                        new Date(value) > new Date() ||
                        'Must be future time',
                    })}
                    className="w-full border rounded-lg px-2 py-1"
                  />
                  {errors.auctionEnd && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.auctionEnd.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  {...register('isClosed', {
                    required: 'Status is required',
                  })}
                  className="w-full border rounded-lg px-2 py-1"
                >
                  <option value="false">Open</option>
                  <option value="true">Closed</option>
                </select>
              </div>

              {errorMessage && (
                <p className="text-red-500 text-xs">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="grid gap-6 sm:grid-cols-2">
        {loading
          ? renderSkeletons(10)
          : filteredAuctions.map((auction) => {
              const isOwner = auction.user?.Id === currentUserId;
              const images: string[] = Array.isArray(auction.image)
                ? auction.image
                : auction.image
                ? [auction.image]
                : [];

              // Get current index from state or default to 0
              const currentIndex = carouselIndexes[auction.id] ?? 0;

              return (
                <div
                  key={auction.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  {/* Carousel container */}
                  <div className="relative w-full h-60 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                    {images.length > 0 ? (
                      <>
                        <Image
                          src={images[currentIndex]}
                          alt={`Auction Image ${currentIndex + 1}`}
                          width={500}
                          height={300}
                          className="w-full h-60 object-cover select-none"
                          unoptimized
                          priority={false}
                        />
                        {/* Left/Prev Button */}
                        <button
                          onClick={() => prevImage(auction.id, images.length)}
                          className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1"
                          aria-label="Previous Image"
                        >
                          ‹
                        </button>
                        {/* Right/Next Button */}
                        <button
                          onClick={() => nextImage(auction.id, images.length)}
                          className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1"
                          aria-label="Next Image"
                        >
                          ›
                        </button>

                        {/* Image counter */}
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-40 text-white text-xs rounded px-2 py-0.5 select-none">
                          {currentIndex + 1} / {images.length}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 italic">No image available</div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-gray-700 mb-2">{auction.description}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Date Listed:{' '}
                      {new Date(auction.dateListed).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Auction End:{' '}
                      {new Date(auction.auctionEnd).toLocaleString()}
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
                          src={auction.user.ProfileImage || '/default.png'}
                          alt={auction.user.Username || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full object-cover mr-3"
                        />
                        <Link
                          href={`/Profile/${auction.user.Id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {auction.user.Username || 'Unknown'}
                        </Link>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/Chat/${auction.id}`)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Enter Auction
                        </button>

                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleEdit(auction.id)}
                              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(auction.id)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
