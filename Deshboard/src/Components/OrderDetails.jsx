import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CopyButton from "./CopyButton";

const STATUS_TABS = [
  { key: "Pending", label: "Pending" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Hold", label: "Hold" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Delivered", label: "Delivered" },
  { key: "Returned", label: "Returned" },
];

const SEND_OPTIONS = [
  {
    key: "Confirmed",
    label: "Confirmed",
    icon: "✓",
    className: "bg-green-600 hover:bg-green-700",
  },
  {
    key: "Hold",
    label: "Hold",
    icon: "❚❚",
    className: "bg-amber-500 hover:bg-amber-600",
  },
  {
    key: "Cancelled",
    label: "Cancelled",
    icon: "✕",
    className: "bg-red-600 hover:bg-red-700",
  },
  {
    key: "Delivered",
    label: "Delivered",
    icon: "🚚",
    className: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "Returned",
    label: "Returned",
    icon: "↩",
    className: "bg-purple-600 hover:bg-purple-700",
  },
];

const ITEMS_PER_PAGE = 10;

const OrderDetails = () => {
  const api = import.meta.env.VITE_SERVER_URL;
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = () => {
    axios
      .get(`${api}api/v3/checkout/AdminReadCheckout`)
      .then((res) => {
        setOrders(res.data.data || []);
      })
      .catch((err) => {
        console.log(err);
        console.error(err.message);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatus = (order) => order.orderStatus || "Pending";

  // প্রতিটা ট্যাবের count একবারেই বের করা, আলাদা API call লাগবে না
  const statusCounts = useMemo(() => {
    const counts = {
      Pending: 0,
      Confirmed: 0,
      Hold: 0,
      Cancelled: 0,
      Delivered: 0,
      Returned: 0,
    };
    orders.forEach((order) => {
      const status = getStatus(order);
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [orders]);

  const tabFilteredOrders = useMemo(
    () => orders.filter((order) => getStatus(order) === activeTab),
    [orders, activeTab],
  );

  const filteredOrders = useMemo(
    () =>
      tabFilteredOrders.filter((order) =>
        (order.uniqueOrderID || "")
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [tabFilteredOrders, search],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, search]);

  const allSelected =
    filteredOrders.length > 0 && selectedIds.length === filteredOrders.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : filteredOrders.map((o) => o._id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSendClick = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one order.");
      return;
    }
    setShowSendModal(true);
  };

  const handleSendStatus = async (orderStatus) => {
    setActionLoading(true);
    try {
      await axios.patch(`${api}api/v3/checkout/bulk-status`, {
        ids: selectedIds,
        orderStatus,
      });
      setOrders((prev) =>
        prev.map((o) =>
          selectedIds.includes(o._id) ? { ...o, orderStatus } : o,
        ),
      );
      setSelectedIds([]);
      setShowSendModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update order status!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one order.");
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} order(s)?`)) return;

    setActionLoading(true);
    try {
      const params = selectedIds.map((id) => `id=${id}`).join("&");
      await axios.delete(`${api}api/v3/checkout/deleteChechout?${params}`);
      setOrders((prev) => prev.filter((o) => !selectedIds.includes(o._id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete order(s)!");
    } finally {
      setActionLoading(false);
    }
  };

   const buildCopyText = (order) => {
     const product = order.items?.[0]?.productId;
     const secretOrName =
       product?.Product_Secret || product?.name?.slice(0, 50) || "";

     return [order.name, order.address, order.phone, secretOrName]
       .filter(Boolean)
       .join("\n");
   };

  const SteadfastBadge = ({ order }) => {
    const Streadfaststatus = order.steadfast?.status;
    if (!Streadfaststatus) {
      return (
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-300">
          Not Sent
        </span>
      );
    }
    return (
      <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-300">
        {Streadfaststatus}
      </span>
    );
  };

  return (
    <section className="py-6">
      <div className="sm:mx-0 sm:px-5 desktop:mx-auto desktop:max-w-[1400px] desktop:px-0">
        <div className="rounded-xl bg-white p-4 shadow-lg desktop:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <span className="text-sm font-medium text-green-500">
              Total {tabFilteredOrders.length} Found
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 desktop:flex desktop:flex-wrap desktop:gap-2">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition desktop:gap-3 desktop:px-4 desktop:py-3 desktop:text-sm ${
                    isActive
                      ? "border-green-600 bg-green-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold desktop:h-6 desktop:w-6 desktop:text-xs ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {statusCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <hr className="mb-5 border-gray-200" />

          <div className="mb-5 flex flex-col gap-2 desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 desktop:gap-2">
              <label className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 desktop:gap-2 desktop:px-4 desktop:py-2.5 desktop:text-sm">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 desktop:h-4 desktop:w-4"
                />
                Select All
              </label>

              <button
                onClick={handleSendClick}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-green-500 px-2.5 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50 desktop:gap-2 desktop:px-4 desktop:py-2.5 desktop:text-sm"
              >
                <span>➤</span> Send
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-red-400 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 desktop:gap-2 desktop:px-4 desktop:py-2.5 desktop:text-sm"
              >
                <span>🗑</span> Delete
              </button>
            </div>

            <div className="relative w-full desktop:w-80">
              <input
                type="text"
                placeholder="Search by Order ID..."
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-3 pr-9 text-xs focus:border-green-400 focus:outline-none desktop:py-2.5 desktop:pl-4 desktop:pr-10 desktop:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 desktop:right-3 desktop:text-base">
                🔍
              </span>
            </div>
          </div>

          {/* ===== Mobile card view ===== */}
          <div className="flex flex-col gap-3 desktop:hidden">
            {paginatedOrders.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No orders found.</p>
            ) : (
              paginatedOrders.map((order) => {
                const quantity = order.items?.[0]?.quantity || 1;
                return (
                  <div
                    key={order._id}
                    className="relative rounded-lg border border-gray-200 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order._id)}
                          onChange={() => toggleSelectOne(order._id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={
                            order.items?.[0]?.productId?.photo?.[0] ||
                            "https://placehold.co/80x80?text=No+Image"
                          }
                          alt="product"
                        />
                      </div>
                      <div className="flex flex-col items-end text-sm">
                        <span className="text-gray-500">
                          Shipping Cost: {order.shippingCost}৳
                        </span>
                        <span className="font-semibold text-gray-800">
                          Total Price: {order.totalPrice}৳
                        </span>
                        <div className="mt-1">
                          <SteadfastBadge order={order} />
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800">{order.name}</p>
                    <a
                      href={`tel:${order.phone}`}
                      className="text-sm text-green-600 underline"
                    >
                      {order.phone}
                    </a>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.address}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <CopyButton text={buildCopyText(order)} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ===== Desktop table view ===== */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-100 desktop:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-sm text-gray-600">
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="p-3 font-bold">Image</th>
                  <th className="p-3 font-bold">Shipping Cost</th>
                  <th className="p-3 font-bold">Total Price</th>
                  <th className="p-3 font-bold">Steadfast</th>
                  <th className="p-3 font-bold">Name</th>
                  <th className="p-3 font-bold">Phone</th>
                  <th className="p-3 font-bold">Address</th>
                  <th className="p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b bg-white text-sm hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order._id)}
                          onChange={() => toggleSelectOne(order._id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="p-3">
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={
                            order.items?.[0]?.productId?.photo?.[0] ||
                            "https://placehold.co/80x80?text=No+Image"
                          }
                          alt="product"
                        />
                      </td>
                      <td className="p-3">{order.shippingCost}৳</td>
                      <td className="p-3">{order.totalPrice}৳</td>
                      <td className="p-3">
                        <SteadfastBadge order={order} />
                      </td>
                      <td className="p-3">{order.name}</td>
                      <td className="p-3">{order.phone}</td>
                      <td className="w-[220px] text-wrap p-3">
                        {order.address}
                      </td>
                      <td className="p-3">
                        <CopyButton text={buildCopyText(order)} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-6 text-center italic text-gray-400"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-col items-center justify-between gap-3 desktop:flex-row">
            <span className="text-sm text-gray-500">
              Showing{" "}
              {filteredOrders.length === 0
                ? 0
                : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
              to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}{" "}
              of {filteredOrders.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
                      currentPage === page
                        ? "bg-green-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <span className="text-2xl text-green-600">➤</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Send Orders To
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose the new status for the selected orders
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              {SEND_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  disabled={actionLoading}
                  onClick={() => handleSendStatus(opt.key)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white transition disabled:opacity-50 ${opt.className}`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrderDetails;
