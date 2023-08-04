import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";

import ProtectedRoute from "Components/PrivateRoute/PrivateRoute";
import PageNotFound from "Pages/PageNotFound/PageNotFound";
import AdminPage from "Pages/AdminPage/AdminPage";
import AppLayout from "Components/AppLayout/AppLayout";
import AuthPage from "Pages/AuthPage/AuthPage";
import HomePage from "Pages/HomePage/HomePage";
import Spinner from "Components/Spinner/Spinner";
import Player from "Components/Player/Player";

import actionTypes from "store/actionTypes";
import { getCurrentUser, sayHiToBackend } from "apis/user";

import "styles/global.scss";

const backendUrl = process.env.REACT_APP_BACKEND_URL;
let socket;
let globalRoomId;
function App() {
  const userDetails = useSelector((state) => state.root.user);
  const roomDetails = useSelector((state) => state.root.room);
  const dispatch = useDispatch();

  const [_dummyState, setDummyState] = useState(0);
  const [isMobileView, setIsMobileView] = useState("");
  const [appLoaded, setAppLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const greetBackend = async () => {
    await sayHiToBackend();
  };

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

  const handleSocketEvents = () => {
    socket.on("connect", () => {
      dispatch({
        type: actionTypes.UPDATE_BANNER,
        banner: {
          green: true,
          text: "🟢 Connection established successfully!",
        },
      });

      setTimeout(() => {
        dispatch({
          type: actionTypes.DELETE_BANNER,
        });
      }, 3000);

      console.log("🔵 Socket connected");

      if (globalRoomId) {
        console.log("🟡re-joining room after re-connect");

        socket.emit("join-room", {
          roomId: globalRoomId,
          userId: userDetails._id,
          ...userDetails,
        });
      }
    });

    socket.on("disconnect", () => {
      dispatch({
        type: actionTypes.UPDATE_BANNER,
        banner: {
          red: true,
          blinking: true,
          text: "🟡 Socket disconnected, trying to reconnect",
        },
      });

      console.log("🔴 Socket disconnected");
    });

    socket.on("error", (msg) => {
      console.log("⚠️ Socket Error", msg);
      toast.error(msg);
    });
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
    if (!userDetails?._id) return;

    socket = io(backendUrl);
    handleSocketEvents();
    setDummyState((prev) => prev + 1);

    return () => {
      if (socket?.disconnect) socket.disconnect();
    };
  }, [userDetails._id]);

  useEffect(() => {
    globalRoomId = roomDetails?._id;
  }, [roomDetails?._id]);

  useEffect(() => {
    handleUserDetection();
    greetBackend();

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

        {userDetails._id && socket ? <Player socket={socket} /> : ""}

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
            <Route path="/" element={<HomePage socket={socket} />} />
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
