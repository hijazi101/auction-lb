import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import '@/app/globals.css';
import Navbar from "@/components/Navbar";
export default function EditAuctionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [auction, setAuction] = useState<any>(null);
  const [form, setForm] = useState({
    image: "",
    description: "",
    initialPrice: "",
    status: "",
    auctionEnd: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/auctions/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setAuction(data);
          setForm({
            image: data.image,
            description: data.description,
            initialPrice: data.initialPrice.toString(),
            status: data.status,
            auctionEnd: data.auctionEnd ? data.auctionEnd.slice(0, 16) : "",
          });
        });
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Save the base64 data URL into form.image
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/auctions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Auction updated!");
      router.push(`/`);
    } else {
      alert(data.error || "Failed to update auction");
    }
  };

  if (!auction)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Loading...</p>
      </div>
    );

  return (
   <>  <Navbar />
    <div className="max-w-5xl mx-auto py-10 px-4 text-black">

      <h1 className="text-3xl font-bold mb-6">Edit Auction</h1>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Preview */}
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-gray-300">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Auction"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            {/* Choose Image File */}
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Choose Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Enter auction description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Initial Price */}
            <div>
              <label
                htmlFor="initialPrice"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Initial Price
              </label>
              <input
                type="number"
                id="initialPrice"
                name="initialPrice"
                placeholder="0.00"
                value={form.initialPrice}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Auction End */}
            <div>
              <label
                htmlFor="auctionEnd"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Auction End Date &amp; Time
              </label>
              <input
                type="datetime-local"
                id="auctionEnd"
                name="auctionEnd"
                value={form.auctionEnd}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Updating..." : "Update Auction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
     </>
  );
}
