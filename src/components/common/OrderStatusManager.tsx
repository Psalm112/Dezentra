// import React, { useState } from "react";
// import { useOrderData } from "../../utils/hooks/useOrderData";
// import { Order } from "../../utils/types";

// interface OrderStatusManagerProps {
//   order: Order;
//   onStatusChange?: () => void;
// }

// export const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
//   order,
//   onStatusChange,
// }) => {
//   const { changeOrderStatus, raiseDispute } = useOrderData();
//   const [loading, setLoading] = useState(false);
//   const [disputeReason, setDisputeReason] = useState("");
//   const [showDisputeForm, setShowDisputeForm] = useState(false);

//   const handleStatusChange = async (status: string) => {
//     setLoading(true);
//     try {
//       await changeOrderStatus(order._id as string, status);
//       if (onStatusChange) {
//         onStatusChange();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDisputeSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await raiseDispute(order._id as string, disputeReason);
//       setShowDisputeForm(false);
//       setDisputeReason("");
//       if (onStatusChange) {
//         onStatusChange();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white p-4 rounded-lg shadow">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
//           <p className="text-sm text-gray-500">
//             Current status: <span className="font-medium">{order.status}</span>
//           </p>
//         </div>
//         <div className="flex space-x-2">
//           {order.status === "pending" && (
//             <>
//               <button
//                 onClick={() => handleStatusChange("completed")}
//                 disabled={loading}
//                 className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//               >
//                 Complete Order
//               </button>
//               <button
//                 onClick={() => setShowDisputeForm(true)}
//                 disabled={loading}
//                 className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
//               >
//                 Raise Dispute
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {showDisputeForm && (
//         <form onSubmit={handleDisputeSubmit} className="mt-4">
//           <div className="mb-4">
//             <label
//               htmlFor="disputeReason"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Dispute Reason
//             </label>
//             <textarea
//               id="disputeReason"
//               value={disputeReason}
//               onChange={(e) => setDisputeReason(e.target.value)}
//               required
//               rows={3}
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//               placeholder="Please explain the reason for this dispute..."
//             />
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               type="button"
//               onClick={() => setShowDisputeForm(false)}
//               className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
//             >
//               Submit
