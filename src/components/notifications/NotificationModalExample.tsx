// import { useState } from "react";
// import { useNotificationModal } from "../../utils/hooks/useNotificationModal";
// import NotificationModal from "./NotificationModal";
// import { Notification } from "../../utils/types";

// // Example component showing how to use the notification modal independently
// const NotificationModalExample = () => {
//   const { isOpen, selectedNotification, openModal, closeModal } =
//     useNotificationModal();
//   const [notifications] = useState<Notification[]>([
//     {
//       _id: "1",
//       recipient: "user123",
//       type: "update",
//       message:
//         "Your account has been successfully updated with new security features. Please review your settings to ensure everything is configured according to your preferences.",
//       read: false,
//       metadata: {
//         orderId: "ORD-12345",
//         updateType: "security",
//         version: "2.1.0",
//       },
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     },
//     {
//       _id: "2",
//       recipient: "user123",
//       type: "funds",
//       message:
//         "Your wallet has been credited with $150.00 from your recent sale. The funds are now available for withdrawal or future purchases.",
//       read: true,
//       metadata: {
//         amount: 150.0,
//         currency: "USD",
//         transactionId: "TXN-67890",
//       },
//       createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
//       updatedAt: new Date(Date.now() - 86400000).toISOString(),
//     },
//     {
//       _id: "3",
//       recipient: "user123",
//       type: "buyer",
//       message:
//         "A new order has been placed for your product 'Premium Widget'. Order #ORD-54321 is now pending and awaiting your confirmation.",
//       read: false,
//       metadata: {
//         orderId: "ORD-54321",
//         productName: "Premium Widget",
//         buyerId: "buyer456",
//       },
//       createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
//       updatedAt: new Date(Date.now() - 3600000).toISOString(),
//     },
//   ]);

//   const handleMarkAsRead = (id: string) => {
//     console.log(`Marking notification ${id} as read`);
//     // Here you would typically call your API to mark the notification as read
//   };

//   return (
//     <div className="p-6 space-y-4">
//       <h2 className="text-2xl font-bold text-white mb-6">
//         Notification Modal Examples
//       </h2>

//       <div className="grid gap-4">
//         {notifications.map((notification) => (
//           <div
//             key={notification._id}
//             className="p-4 bg-[#292B30] rounded-lg cursor-pointer hover:bg-[#333940] transition-colors duration-200"
//             onClick={() => openModal(notification)}
//           >
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-white font-medium">
//                   {notification.type.charAt(0).toUpperCase() +
//                     notification.type.slice(1)}{" "}
//                   Notification
//                 </p>
//                 <p className="text-gray-400 text-sm mt-1">
//                   {notification.message.length > 80
//                     ? `${notification.message.substring(0, 80)}...`
//                     : notification.message}
//                 </p>
//                 <p className="text-gray-500 text-xs mt-2">
//                   {new Date(notification.createdAt).toLocaleDateString()}
//                 </p>
//               </div>
//               <div className="flex items-center space-x-2">
//                 {!notification.read && (
//                   <div className="w-3 h-3 rounded-full bg-red-500" />
//                 )}
//                 <span className="text-gray-400 text-sm">
//                   Click to view details
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <NotificationModal
//         notification={selectedNotification}
//         isOpen={isOpen}
//         onClose={closeModal}
//         onMarkAsRead={handleMarkAsRead}
//       />
//     </div>
//   );
// };

// export default NotificationModalExample;
