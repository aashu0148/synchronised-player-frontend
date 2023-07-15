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
const firebaseConfig2 = {
  apiKey: "AIzaSyCcfbNR6CThUV8NITItK60UkFePcYHAMsE",
  authDomain: "sleeping-owl-music-2.firebaseapp.com",
  projectId: "sleeping-owl-music-2",
  storageBucket: "sleeping-owl-music-2.appspot.com",
  messagingSenderId: "1044286995219",
  appId: "1:1044286995219:web:e205d8f870eb52cad938e6",
  measurementId: "G-HWDDDXT69G",
};

// const app = initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig2);

const auth = getAuth();

const storage = getStorage(app);

const googleAuthProvider = new GoogleAuthProvider();

const uploadAudio = (file, progressCallback, urlCallback, errorCallback) => {
  if (!file) {
    errorCallback("File not found");
    return;
  }

  const storageRef = ref(storage, `songs/${file.name}`);

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

  const cancelUpload = () => task.cancel();

  return cancelUpload;
};

export { app as default, auth, googleAuthProvider, uploadAudio };
