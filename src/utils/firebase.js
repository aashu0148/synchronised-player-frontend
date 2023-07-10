import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMvfBlsGu3Lyqh_ySkjOYOZSejr9pq7yQ",
  authDomain: "sleeping-owl-music.firebaseapp.com",
  projectId: "sleeping-owl-music",
  storageBucket: "sleeping-owl-music.appspot.com",
  messagingSenderId: "938122370109",
  appId: "1:938122370109:web:e933784ba2841432e5de54",
  measurementId: "G-93BVE8ZGPP",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();

const storage = getStorage(app);

const googleAuthProvider = new GoogleAuthProvider();

const uploadImage = (file, progressCallback, urlCallback, errorCallback) => {
  if (!file) {
    errorCallback("File not found");
    return;
  }

  const fileType = file.type;
  const fileSize = file.size / 1024 / 1024;

  if (!fileType.includes("image")) {
    errorCallback("File must an image");
    return;
  }
  if (fileSize > 4) {
    errorCallback("File must smaller than 4MB");
    return;
  }

  const storageRef = ref(storage, `images/${file.name}`);

  const task = uploadBytesResumable(storageRef, file);

  task.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressCallback(progress);
    },
    (error) => {
      errorCallback(error.message);
    },
    () => {
      getDownloadURL(storageRef).then((url) => {
        urlCallback(url);
      });
    }
  );
};

export { app as default, auth, googleAuthProvider, uploadImage };
