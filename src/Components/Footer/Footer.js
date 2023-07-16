import React from "react";
import { Linkedin, Mail } from "react-feather";

import logo from "assets/logos/logo.svg";

import styles from "./Footer.module.scss";

function Footer() {
  const links = [
    {
      link: "https://www.linkedin.com/in/aashu0148",
      value: "linkedin",
      label: "Linkedin",
      icon: <Linkedin />,
    },
    {
      link: "mailto:aashu.1st@gmail.com",
      value: "mail",
      label: "Mail",
      icon: <Mail />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.details}>
        <p className={styles.desc}>
          Wana request some features? Have a query ? Or just wana say hi ?<br />{" "}
          Feel free to drop me a message, I'll try to reply asap
        </p>

        <div className={styles.socials}>
          {links.map((item) => (
            <a
              key={item.value}
              href={item.link}
              target="_blank"
              className={`${styles.social}`}
              title={item.label}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.sleepingOwl}>
        <div className={styles.logo}>
          <span>
            <img src={logo} alt="Sleeping_owl" />
          </span>
        </div>

        <p className={styles.title}>Sleeping owl</p>
      </div>
    </div>
  );
}

export default Footer;
