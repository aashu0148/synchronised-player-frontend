import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCD-dbFg3vshnLhLPI7Z0ZapbV9neso2Z4",
  authDomain: "sleeping-owl-storage-3.firebaseapp.com",
  projectId: "sleeping-owl-storage-3",
  storageBucket: "sleeping-owl-storage-3.appspot.com",
  messagingSenderId: "194218088509",
  appId: "1:194218088509:web:f2efefd91e242a95b9f254",
};

const app = initializeApp(firebaseConfig);

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
