// pages/My_orders.jsx
'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
  const isAdmin = email === 'mm@gmail.com';
const undeliveredOrders = orders.filter(order => !order.isDelivered);
const deliveredOrders = orders.filter(order => order.isDelivered);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/orders?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);

  const toggleDelivered = (id) => {
    fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? { ...o, isDelivered: updated.delivered }
              : o
          )
        );
      })
      .catch(console.error);
  };

  if (loading) return <div className="p-6">Loading...</div>;
return (
  <div>
    <Navbar />

    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Orders</h1>

      {undeliveredOrders.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-yellow-600">Pending Orders</h2>
          <div className="space-y-6">
            {undeliveredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center p-4 bg-white shadow-sm border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">{order.itemName}</h2>
                  <p className="text-sm text-gray-500">Order Date: {order.orderDate}</p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-semibold">Pending</span>
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-lg font-semibold text-gray-800">
                    ${order.winnedprice}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => toggleDelivered(order.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deliveredOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-green-600">Delivered Orders</h2>
          <div className="space-y-6">
            {deliveredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center p-4 bg-white shadow-sm border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">{order.itemName}</h2>
                  <p className="text-sm text-gray-500">Order Date: {order.orderDate}</p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-semibold">Delivered</span>
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-lg font-semibold text-gray-800">
                    ${order.winnedprice}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => toggleDelivered(order.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Mark Undelivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && <p>No orders found.</p>}
    </div>
  </div>
);
}
