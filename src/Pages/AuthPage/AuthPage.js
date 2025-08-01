import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";

import styles from "./AuthPage.module.scss";
import { loginWithCredentials, registerUser } from "apis/user/index";

function AuthPage() {
  const googleSignInButtonRef = useRef();
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.root.user);
  const isMobileView = useSelector((state) => state.root.mobileView);
  const [searchParams] = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // const initializeGsi = (fallback = "") => {
  //   if (!window.google) return;

  //   const href = window.location.href;
  //   // const queryParams = href.split("?")[1] || "";

  //   const search = `?origin=${window.location.origin}`;
  //   const googleRedirectUrl = `${process.env.REACT_APP_BACKEND_URL}/user/google-login${search}`;
  //   // const search = `?origin=${window.location.origin}&fallback=${
  //   //   fallback || ""
  //   // }&query=${queryParams}`;

  //   console.log({ googleRedirectUrl });
  //   setTimeout(() => setLoading(false), 1200);

  //   window.google.accounts.id.initialize({
  //     client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  //     ux_mode: "redirect",
  //     login_uri: googleRedirectUrl,
  //   });
  //   window.google.accounts.id.renderButton(
  //     document.getElementById("g_id_signin"),
  //     { theme: "outline", size: "large", width: 390 }
  //   );
  // };

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const fallback = searchParams.get("fallback");
    const accessToken = searchParams.get("accessToken");

    if (accessToken) {
      localStorage.setItem("sleeping-token", accessToken);

      if (fallback && fallback !== "null") window.location.replace(fallback);
      else window.location.replace(query ? `/?${query}` : "/");
    }

    // const script = document.createElement("script");
    // script.src = "https://accounts.google.com/gsi/client";
    // script.onload = () => initializeGsi(fallback);
    // script.async = true;
    // script.id = "google-client-script";
    // document.body.appendChild(script);

    // return () => {
    //   if (window.google) window.google.accounts.id.cancel();

    //   document.getElementById("google-client-script")?.remove();
    // };
  }, []);

  useEffect(() => {
    if (userDetails._id) navigate("/");
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      authMode === "register" &&
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match");
      return;
    }

    try {
      const values = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      setSubmitting(true);
      const data =
        authMode === "login"
          ? await loginWithCredentials(values)
          : await registerUser(values);

      if (!data) {
        throw new Error("Authentication failed");
      }

      localStorage.setItem("sleeping-token", data.data?.token);
      window.location.replace("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--var-bg)] px-4">
      <div className="w-full max-w-md bg-[var(--var-bg-1)] rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-[var(--var-heading)] mb-2">
          Welcome buddy!
        </h1>
        <p className="text-[var(--var-desc)] text-center mb-6">
          I hope you are having a fantastic day! If not then don't worry, just
          login and make your mood with music
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {authMode === "register" && (
            <InputControl
              label="Name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          )}
          <InputControl
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <InputControl
            label="Password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            password
            required
          />
          {authMode === "register" && (
            <InputControl
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              password={true}
              required
            />
          )}
          {error && (
            <p className="text-[var(--var-red)] text-sm mt-2">{error}</p>
          )}
          <Button
            type="submit"
            className="!w-full py-2 bg-[var(--var-white)] hover:bg-[var(--var-secondary)] text-[var(--var-button-color)] rounded-md transition-colors duration-200"
            useSpinnerWhenDisabled
            disabled={submitting}
          >
            {authMode === "login" ? "Login" : "Register"}
          </Button>
          <p className="text-center text-sm mt-3 text-[var(--var-desc)]">
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <span
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              className="text-[var(--var-white)] cursor-pointer hover:underline font-medium"
            >
              {authMode === "login" ? "Register" : "Login"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
