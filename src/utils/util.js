import toast from "react-hot-toast";

import store from "store";
import actionTypes from "store/actionTypes";
import { getCurrentUser } from "apis/user";

const backendApiUrl = process.env.REACT_APP_BACKEND_URL;

export const handleNumericInputKeyDown = (event) => {
  let key = event.key;

  if (
    key === "Backspace" ||
    key === "Tab" ||
    key === "Delete" ||
    key.toLowerCase() === "arrowleft" ||
    key.toLowerCase() === "arrowright" ||
    key.toLowerCase() === "arrowup" ||
    key.toLowerCase() === "arrowdown" ||
    (event.ctrlKey && (key == "v" || key == "V"))
  )
    return;

  if (!/[0-9]/.test(key)) {
    event.returnValue = false;

    if (event.preventDefault) event.preventDefault();
  }
};

export const generateUniqueString = () => {
  return parseInt(Date.now() + Math.random() * 99999999).toString(16);
};

export function autoAdjustTextareaHeight(event = {}) {
  const textarea = event?.target;
  if (!textarea) return;

  textarea.style.height = "auto"; // Reset the height to auto to recalculate the scroll height

  // Set the height to the scroll height of the content
  textarea.style.height = textarea.scrollHeight + "px";
}

export const errorToastLogger = (
  functionName,
  message,
  error,
  preventToast = false,
  neutralToast = false
) => {
  if (message) {
    if (typeof message !== "object" && !preventToast) {
      if (neutralToast) toast("" + message);
      else toast.error("" + message);
    }
    console.error(`Error at ${functionName} : ${error ? error : message}`);
    return;
  }

  console.error(`Error at ${functionName} : ${error ? error : ""}`);
};

export const handleLogout = async () => {
  localStorage.removeItem("sleeping-token");

  store.dispatch({
    type: actionTypes.USER_LOGOUT,
  });

  if (!window.location.href.includes("auth")) window.location.replace("/auth");
};

export const syncUserWithBackend = async () => {
  let res = await getCurrentUser();
  if (!res.data) return;

  const user = res?.data;

  store.dispatch({
    type: actionTypes.USER_LOGIN,
    user,
  });
};

export const fetchWrapper = async (
  path,
  data = "",
  headers = {},
  requestType = "",
  isPublic = false,
  usePathAsUrl = false
) => {
  const url = usePathAsUrl ? path : backendApiUrl + path;
  const fetchOptions = {
    method: requestType || (data ? "POST" : "GET"),
    headers: {
      ...headers,
    },
  };

  if (!isPublic) {
    const token = localStorage.getItem("sleeping-token");
    if (!token) {
      handleLogout();
      toast.error("Not logged in!");
      return;
    }

    fetchOptions.headers["Authorization"] = token;
  }

  if (data && typeof data === "object") {
    fetchOptions.body = JSON.stringify(data);
    fetchOptions.headers["Content-Type"] = "application/json";
  }

  return fetch(url, fetchOptions);
};

export function getRandomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const validateEmail = (email) => {
  if (!email) return false;
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

export const validatePassword = (pass) => {
  if (!pass) return false;
  return /^(?=.*[0-9])(?=.*[!@#$%^&+*])[a-zA-Z0-9!@#$%^&+*]{6,18}$/.test(pass);
};

export const getFileHashSha256 = async (blob) => {
  if (!blob) return;

  const uint8Array = new Uint8Array(await blob.arrayBuffer());
  const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((h) => h.toString(16).padStart(2, "0")).join("");
};

export const compareTwoObjects = (obj1, obj2) => {
  if (!obj1 || !obj2) return false;
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

  for (let key in obj1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    let equality;
    if (
      typeof val1 == "object" &&
      typeof val2 == "object" &&
      !Array.isArray(val1) &&
      !Array.isArray(val2)
    )
      equality = compareTwoObjects(val1, val2);
    else equality = JSON.stringify(val1) == JSON.stringify(val2);

    if (!equality) return false;
  }

  return true;
};
