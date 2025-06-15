// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Loadscreen from "./Loadscreen";
// import { useAuth } from "../context/AuthContext";

// const GoogleCallback = () => {
//   const navigate = useNavigate();
//   const { handleAuthCallback } = useAuth();

//   useEffect(() => {
//     const handleGoogleCallback = async () => {
//       try {
//         const responseText = document.body.innerText;
//         console.log("Response text:", responseText);

//         const responseData = JSON.parse(responseText);
//         console.log("Parsed response data:", responseData);

//         if (responseData.success && responseData.token && responseData.user) {
//           // Save authentication state
//           handleAuthCallback(responseData.token, responseData.user);

//           // Redirect to home or previous page
//           navigate("/", { replace: true });
//         } else {
//           throw new Error("Invalid authentication response");
//         }
//       } catch (error) {
//         console.error("Failed to process Google callback:", error);
//         navigate("/login", { replace: true });
//       }
//     };

//     // Execute the callback handler
//     handleGoogleCallback();
//   }, [handleAuthCallback, navigate]);

//   return <Loadscreen />;
// };

// export default GoogleCallback;
