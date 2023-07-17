import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "Components/Button/Button";

import styles from "./AuthPage.module.scss";

function AuthPage() {
  const googleSignInButtonRef = useRef();
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.root.user);
  const isMobileView = useSelector((state) => state.root.mobileView);
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);

  const initializeGsi = (fallback = "") => {
    if (!window.google) return;
    const googleRedirectUrl = `${process.env.REACT_APP_BACKEND_URL}/user/google-login?origin=${window.location.origin}&fallback=${fallback}`;

    setTimeout(() => setLoading(false), 1200);

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      ux_mode: "redirect",
      login_uri: googleRedirectUrl,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("g_id_signin"),
      { theme: "outline", size: "large", width: 390 }
    );
  };

  useEffect(() => {
    const fallback = searchParams.get("fallback");
    const accessToken = searchParams.get("accessToken");

    if (accessToken) {
      localStorage.setItem("sleeping-token", accessToken);

      if (fallback && fallback !== "null") window.location.replace(fallback);
      else window.location.replace("/");
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => initializeGsi(fallback);
    script.async = true;
    script.id = "google-client-script";
    document.body.appendChild(script);

    return () => {
      if (window.google) window.google.accounts.id.cancel();

      document.getElementById("google-client-script")?.remove();
    };
  }, []);

  useEffect(() => {
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

        <Button
          onClick={() =>
            googleSignInButtonRef.current
              ? googleSignInButtonRef.current.click()
              : ""
          }
          disabled={loading}
          useSpinnerWhenDisabled
        >
          <div
            className={styles.actualGoogleButton}
            ref={googleSignInButtonRef}
            id="g_id_signin"
            data-width={isMobileView ? 350 : 410}
          />
          Google login
        </Button>
      </div>
    </div>
  );
}

export default AuthPage;
