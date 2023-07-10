import React, { useState } from "react";
import { toast } from "react-hot-toast";

import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";

import { getAdminAccess } from "apis/user";

import styles from "./AdminPage.module.scss";

function AdminPage() {
  const [showPasswordBox, setShowPasswordBox] = useState(true);
  const [password, setPassword] = useState("");
  const [disabledButtons, setDisabledButtons] = useState({
    password: false,
  });
  const [errors, setErrors] = useState({
    password: "",
  });

  const handlePasswordSubmission = async () => {
    setErrors((prev) => ({ ...prev, password: "" }));
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Enter password" }));
      return;
    }

    setDisabledButtons((prev) => ({ ...prev, password: true }));
    const res = await getAdminAccess({
      password,
    });
    setDisabledButtons((prev) => ({
      ...prev,
      password: false,
    }));
    if (!res) return;

    toast.success("Password matched");
    setShowPasswordBox(true);
  };

  const passwordBox = (
    <div className={styles.passContainer}>
      <div className={styles.passBox}>
        <InputControl
          label="Enter password to get admin access"
          placeholder="Enter password"
          password
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />

        <Button
          disabled={disabledButtons.password}
          useSpinnerWhenDisabled
          onClick={handlePasswordSubmission}
        >
          Submit
        </Button>
      </div>
    </div>
  );

  return showPasswordBox ? (
    passwordBox
  ) : (
    <div className={styles.container}>
      <p className={styles.title}>Welcome back Admin!</p>
    </div>
  );
}

export default AdminPage;
