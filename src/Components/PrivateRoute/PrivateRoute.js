import React from "react";
import { useSelector } from "react-redux";

import Spinner from "Components/Spinner/Spinner";

function ProtectedRoute({ children }) {
  const userDetails = useSelector((state) => state.root);

  if (!userDetails._id) {
    window.location.replace("/auth");

    return (
      <div className="spinner-container">
        <Spinner />
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
