import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "react-feather";

import Modal from "Components/Modal/Modal";
import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";

import { uploadAudio } from "utils/firebase";
import { getFileHashSha256 } from "utils/util";
import { addNewSong } from "apis/song";

import styles from "./AddSongModal.module.scss";

let abortUpload = () => console.log("func not attached");
function AddSongModal({ onClose, onSuccess }) {
  const fileInputRef = useRef();
  const audioElemRef = useRef({});

  const [values, setValues] = useState({
    title: "",
    artist: "",
    length: 0,
    url: "",
    file: "",
    fileType: "",
  });
  const [errors, setErrors] = useState({
    file: "",
  });
  const [uploadDetails, setUploadDetails] = useState({
    uploading: false,
    progress: 0,
    name: "",
    fileType: "",
    length: "",
    url: "",
    uploadedFile: "",
    file: "",
  });
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);

  const validateAudioFile = (file) => {
    const { type, size } = file;
    const maxFileSizeAllowed = 8;

    if (!type.includes("audio"))
      return {
        success: false,
        message: "Not a audio file",
      };
    if (size / 1024 / 1024 > maxFileSizeAllowed)
      return {
        success: false,
        message: `Due to constraints of free servers, right now we only accept files smaller than ${maxFileSizeAllowed}MB, found: ${parseFloat(
          size / 1024 / 1024
        ).toFixed(2)}MB`,
      };

    return {
      success: true,
      message: "Valid audio file",
    };
  };

  const readAudio = (file) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      audioElemRef.current.src = e.target.result;
      audioElemRef.current.addEventListener(
        "loadedmetadata",
        function () {
          const duration = parseInt(audioElemRef.current.duration);

          setValues((prev) => ({ ...prev, length: duration }));
        },
        false
      );
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (uploadDetails.uploading) {
      fileInputRef.current.value = "";
      return;
    }

    setErrors((prev) => ({ ...prev, file: "" }));
    const fileValidation = validateAudioFile(file);
    if (!fileValidation.success) {
      setErrors((prev) => ({ ...prev, file: fileValidation.message }));
      return;
    }

    setValues((prev) => ({ ...prev, title: file.name.split(".")[0] }));
    setUploadDetails({
      uploading: true,
      progress: 0,
      file: file,
      fileType: file.type,
      name: file.name,
    });

    const cancelUpload = uploadAudio(
      file,
      (progress) => {
        setUploadDetails((prev) => ({
          ...prev,
          progress: progress.toFixed(2),
        }));
      },
      (url) => {
        setUploadDetails((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          url,
          uploadedFile: file.name,
        }));
        setValues((prev) => ({
          ...prev,
          file,
          url,
          fileType: file.type,
        }));
        readAudio(file);
        setErrors((prev) => ({ ...prev, file: "" }));
      },
      (err) => {
        setUploadDetails((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
        }));

        if (!err.includes("canceled"))
          setErrors((prev) => ({ ...prev, file: `Error: ${err}` }));
      }
    );

    abortUpload = () => {
      cancelUpload();
    };

    fileInputRef.current.value = "";
  };

  const validateForm = () => {
    let errors = {};

    if (!values.title || !values.title.trim()) errors.title = "Title required";
    if (!values.artist || !values.artist.trim())
      errors.artist = "Artist required";
    if (!values.url) errors.file = "Song required";

    if (Object.keys(errors).length) {
      setErrors(errors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  };

  const handleSubmission = async () => {
    if (!validateForm() || uploadDetails.uploading) return;

    const hash = await getFileHashSha256(values.file);

    const body = {
      hash,
      length: values.length,
      title: values.title.trim(),
      artist: values.artist.trim(),
      fileType: values.fileType,
      url: values.url,
    };

    setSubmitButtonDisabled(true);
    const res = await addNewSong(body);
    setSubmitButtonDisabled(false);
    if (!res) return;

    toast.success("Song added successfully");
    if (onClose) onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal onClose={onClose} closeOnBlur={false}>
      <div className={styles.container}>
        <input
          type="file"
          style={{ display: "none" }}
          ref={fileInputRef}
          accept=".mp3,.wav"
          onChange={handleFileChange}
        />

        <p className={styles.title}>Upload new song</p>

        <div className={styles.form}>
          <div className={styles.item}>
            <label>Upload a song</label>

            <div className={styles.uploadBox}>
              {uploadDetails.uploading ? (
                <div className={styles.uploading}>
                  <p className={styles.title}>{uploadDetails.name}</p>
                  <div className={styles.progress}>
                    UPLOADING...
                    <span>{uploadDetails.progress}%</span>
                    <div className={styles.icon} onClick={abortUpload}>
                      <X />
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className={styles.upload}
                  onClick={() => fileInputRef.current.click()}
                >
                  {uploadDetails.uploadedFile || "Click to upload"}
                </p>
              )}
            </div>
            {errors.file && <p className="error-msg">{errors.file}</p>}

            <audio
              className={styles.audioElem}
              ref={audioElemRef}
              controls
              style={{
                display: values.file && !uploadDetails.uploading ? "" : "none",
              }}
            />
          </div>

          <InputControl
            label="Song title"
            placeholder="Enter title"
            error={errors.title}
            value={values.title}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, title: event.target.value }))
            }
          />

          <InputControl
            label="Song artist"
            placeholder="Enter artist"
            error={errors.artist}
            value={values.artist}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, artist: event.target.value }))
            }
          />

          <div className={styles.footer}>
            <Button cancelButton onClick={onClose}>
              Close
            </Button>

            <Button
              onClick={handleSubmission}
              disabled={submitButtonDisabled}
              useSpinnerWhenDisabled
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AddSongModal;
