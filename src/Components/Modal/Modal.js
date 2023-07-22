import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { ArrowLeft, X } from "react-feather";

import styles from "./Modal.module.scss";

function Modal({
  className,
  title,
  onClose,
  doNotAnimate,
  noTopPadding,
  styleToInner,
  hideCloseButton = false,
  closeOnBlur = true,
  fullScreenInMobile = false,
  ...props
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef();
  const isMobileView = useSelector((state) => state.root.mobileView);

  const [lastLocation, setLastLocation] = useState("");

  const handleCloseModal = () => {
    if (!onClose) return;

    onClose();

    if (!location.search?.includes("modal")) return;

    navigate(-1);
  };

  const handleURLParamsOnMount = () => {
    const location = window.location;
    const params = new URLSearchParams(location.search);

    if (location.search?.includes("modal")) return;
    params.append("modal", "true");

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const handleLocationChange = () => {
    const currLocation = location.pathname + location.search;

    if (!lastLocation || lastLocation == currLocation) {
      setLastLocation(currLocation);
      return;
    }
    setLastLocation(currLocation);

    const params = new URLSearchParams(location.search);
    if (!params.get("modal") && onClose) handleCloseModal();
  };

  useEffect(() => {
    handleLocationChange();
  }, [location]);

  useEffect(() => {
    if (isMobileView) {
      document.body.style.overflowY = "hidden";
    }
    handleURLParamsOnMount();

    const isHidden = document.body.style.overflowY === "hidden";
    if (!isHidden) document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const modal = isMobileView ? (
    <div
      ref={containerRef}
      className={`${styles.mobileContainer} ${
        title || noTopPadding ? styles.modalWithTitle : ""
      } ${fullScreenInMobile ? styles.fullScreenMobile : ""} ${
        className || ""
      }`}
      onClick={(event) =>
        event.target == containerRef.current && onClose
          ? handleCloseModal()
          : ""
      }
      style={{ zIndex: +props.zIndex || "" }}
    >
      <div className={`${styles.inner} custom-scroll`} style={styleToInner}>
        {title && (
          <div className={styles.modalTitle}>
            <div className={styles.heading}>{title}</div>
            {onClose && <X onClick={handleCloseModal} />}
          </div>
        )}
        {props.children}

        {/* {fullScreenInMobile && (
          <div className={styles.controls}>
            <div
              className={`icon ${styles.icon}`}
              onClick={() => (onClose ? handleCloseModal() : "")}
            >
              <ArrowLeft />
            </div>
          </div>
        )} */}
      </div>
    </div>
  ) : (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ""}`}
      onClick={(event) =>
        event.target == containerRef.current && onClose && closeOnBlur
          ? handleCloseModal()
          : ""
      }
    >
      <div
        className={`${styles.inner} ${
          doNotAnimate ? styles.preventAnimation : ""
        }`}
        style={styleToInner}
      >
        {onClose && !hideCloseButton ? (
          <div
            className={`icon ${styles.close}`}
            onClick={() => (onClose ? handleCloseModal() : "")}
          >
            <X />
          </div>
        ) : (
          ""
        )}
        {props.children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

export default Modal;
