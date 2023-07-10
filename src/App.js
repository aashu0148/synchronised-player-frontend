import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "Components/PrivateRoute/PrivateRoute";
import PageNotFound from "Pages/PageNotFound/PageNotFound";
import AdminPage from "Pages/AdminPage/AdminPage";
import AppLayout from "Components/AppLayout/AppLayout";
import AuthPage from "Pages/AuthPage/AuthPage";
import Spinner from "Components/Spinner/Spinner";

import actionTypes from "store/actionTypes";
import { getCurrentUser } from "apis/user";

import "styles/global.scss";

function App() {
  const userDetails = useSelector((state) => state.root);
  const dispatch = useDispatch();

  const [isMobileView, setIsMobileView] = useState("");
  const [appLoaded, setAppLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleUserDetection = async () => {
    const sleepingToken = localStorage.getItem("sleeping-token");
    if (!sleepingToken) {
      setAppLoaded(true);
      setIsAuthenticated(false);
      return;
    }

    let res = await getCurrentUser();
    setAppLoaded(true);
    if (!res) {
      localStorage.removeItem("sleeping-token");
      return;
    }
    setIsAuthenticated(true);

    const user = res?.data;
    if (user) dispatch({ type: actionTypes.USER_LOGIN, user });
  };

  const handleResize = (event) => {
    const width = event.target.outerWidth;
    if (width < 768) setIsMobileView(true);
    else setIsMobileView(false);
  };

  useEffect(() => {
    if (typeof isMobileView !== "boolean") {
      setIsMobileView(window.outerWidth < 768);
      dispatch({
        type: actionTypes.SET_MOBILE_VIEW,
        isMobileView: window.outerWidth < 768,
      });
    } else
      dispatch({
        type: actionTypes.SET_MOBILE_VIEW,
        isMobileView,
      });
  }, [isMobileView]);

  useEffect(() => {
    handleUserDetection();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return appLoaded ? (
    <div className="main-app">
      <BrowserRouter>
        <Toaster
          position="bottom"
          toastOptions={{
            duration: 3000,
          }}
        />

        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/" element={<h1>Home page</h1>} />
          </Route>

          <Route path="/*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  ) : (
    <div className="spinner-container">
      <Spinner />
    </div>
  );
}

export default App;
