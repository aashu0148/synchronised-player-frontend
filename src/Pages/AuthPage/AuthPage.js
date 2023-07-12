import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
} from "firebase/auth";

import Button from "Components/Button/Button";

import { auth, googleAuthProvider } from "utils/firebase";
import { loginUser } from "apis/user";
import actionTypes from "store/actionTypes";

import styles from "./AuthPage.module.scss";

function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.root.user);

  const [loading, setLoading] = useState(true);

  const handleLogin = async () => {
    setLoading(true);
    await signInWithRedirect(auth, googleAuthProvider);
  };

  const loginUserWithBackend = async (details) => {
    const res = await loginUser(details);
    setLoading(false);
    if (!res?.data) return;

    const { user, token } = res.data;
    dispatch({ type: actionTypes.USER_LOGIN, user });
    localStorage.setItem("sleeping-token", token);
    navigate("/");
    toast.success("Login successful");
  };

  const checkForRedirectionResults = async () => {
    try {
      const res = await getRedirectResult(auth);
      if (!res) {
        setLoading(false);
        return;
      }
      const credential = GoogleAuthProvider.credentialFromResult(res);
      const token = credential.accessToken;

      const user = res.user?.reloadUserInfo;
      loginUserWithBackend({
        ...user,
        name: user.displayName,
        profileImage: user.photoUrl,
        token,
      });
    } catch (err) {
      console.log(err);

      toast.error(`Error signing with google - ${err.message || ""}`);
    }
  };

  useEffect(() => {
    checkForRedirectionResults();

    if (userDetails._id) navigate("/");
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <p className={styles.title}>Welcome buddy!</p>

        <p className={styles.desc}>
          I hope you are having a fantastic day! If not then don't worry, just
          login and make your mood with music
        </p>

        <Button onClick={handleLogin} disabled={loading} useSpinnerWhenDisabled>
          Google login
        </Button>
      </div>
    </div>
  );
}

export default AuthPage;
