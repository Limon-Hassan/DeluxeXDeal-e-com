import React, { useState, useEffect } from "react";
import axios from "axios";
import CopyButton from "./CopyButton";

const OrderDetails = () => {
  const api = import.meta.env.VITE_SERVER_URL;
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get(`${api}api/v3/checkout/AdminReadCheckout`)
      .then((res) => {
        setOrders(res.data.data);
      })
      .catch((err) => {
        console.log(err);
        console.error(err.message);
      });
  }, []);

  const filteredOrders = orders.filter((order) =>
    order.uniqueOrderID.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`${api}api/v3/checkout/deleteChechout?id=${orderId}`);
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== orderId),
      );
      alert("Order deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete order!");
    }
  };

  return (
    <section className="py-6">
      <div className="sm:mx-0 sm:px-5 desktop:mx-auto desktop:max-w-[1400px] desktop:px-0">
        <div className="rounded-lg bg-white shadow-lg sm:p-3 desktop:p-6">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-xl font-bold">Order Details</h2>
            <h2 className="mb-4 text-sm font-bold text-gray-600">
              Total {orders.length} Found
            </h2>
          </div>

          <div className="max-h-[500px] w-full overflow-y-auto rounded-md bg-gray-400/30 p-3 desktop:hidden">
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              filteredOrders.map((order) => {
                const quantity = order.items?.[0]?.quantity || 1;
                const copyText = `${order.name} ${order.phone} ${order.address}  ${order.items[0].productId?.name.slice(0, 50)}`;
                return (
                  <div
                    key={order._id}
                    className="relative mb-4 border-b border-gray-600"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <img
                          className="h-[80px] w-[80px] rounded-lg object-contain"
                          src={order.items[0].productId?.photo[0]}
                          alt="product"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span>S.Cost : {order.shippingCost}৳</span>
                        <span>Total : {order.totalPrice}৳</span>
                        <span>Qty : {quantity}</span>
                        <span>
                          Action :
                          <span
                            onClick={() => handleDelete(order._id)}
                            className="text-red-500 underline"
                          >
                            Delete
                          </span>
                        </span>
                      </div>
                    </div>
                    <h4>Name: {order.name}</h4>
                    <h4 className="mb-5 max-w-[290px] text-wrap text-[16px] font-bold text-gray-700">
                      Address:
                      <a
                        className="ml-2 mr-2 text-green-500 underline"
                        href={`tel:${order.phone}`}
                      >
                        {order.phone}
                      </a>
                      {order.address}
                    </h4>
                    <div className="absolute bottom-0 right-0">
                      <CopyButton text={copyText} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mb-4 gap-2 sm:hidden desktop:flex">
            <input
              type="text"
              placeholder="Search by Order ID..."
              className="w-full rounded border p-2 focus:border-blue-400 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full overflow-x-auto rounded-lg bg-white shadow-md sm:hidden desktop:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-100 text-left">
                  <th className="p-3">Image</th>
                  <th className="p-3">Shipping Cost</th>
                  <th className="p-3">Total Price</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const copyText = `${order.name} ${order.phone} ${order.address}  ${order.items[0].productId?.name.slice(0, 50)}`;
                    return (
                      <tr
                        key={order._id}
                        className="relative border-b bg-gray-50"
                      >
                        <img
                          className="h-[90px] w-[90px] rounded object-cover px-1 py-3"
                          src={order.items[0].productId?.photo[0]}
                          alt="product"
                        />
                        <td className="px-1 py-3">{order.shippingCost}৳</td>
                        <td className="px-1 py-3">{order.totalPrice}৳</td>
                        <td className="px-1 py-3">{order.name}</td>
                        <td className="px-1 py-3">{order.phone}</td>
                        <td className="w-[200px] overflow-hidden text-clip text-wrap px-1 py-3">
                          {order.address}
                        </td>

                        <div className="absolute right-[50px] top-[20px] flex flex-col px-1 py-3">
                          <button
                            onClick={() => handleDelete(order._id)}
                            className="text-red-500 hover:underline"
                          >
                            🗑 Delete
                          </button>
                          <span>
                            <CopyButton text={copyText} />
                          </span>
                        </div>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-4 text-center italic text-gray-500"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetails;
