import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "Components/Navbar/Navbar";

import styles from "./AppLayout.module.scss";

function AppLayout() {
  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.inner}>
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
