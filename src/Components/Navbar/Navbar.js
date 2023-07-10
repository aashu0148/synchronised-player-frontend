import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "react-feather";

import { handleLogout } from "utils/util";

import styles from "./Navbar.module.scss";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <p className={styles.logo} onClick={() => navigate("/")}>
        Sleeping owl
      </p>

      <div className={styles.right}>
        <div className={styles.logout} onClick={() => handleLogout()}>
          <LogOut />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
