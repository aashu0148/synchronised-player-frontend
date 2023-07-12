import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "react-feather";

import owlLogo from "assets/logos/logo.svg";
import { handleLogout } from "utils/util";

import styles from "./Navbar.module.scss";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <img src={owlLogo} alt="sleeping owl" />

        <p className={styles.text} onClick={() => navigate("/")}>
          Sleeping owl
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.logout} onClick={() => handleLogout()}>
          <LogOut />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
