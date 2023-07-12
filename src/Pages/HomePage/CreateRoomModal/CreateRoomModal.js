import React, { useEffect, useState } from "react";
import { X } from "react-feather";
import { toast } from "react-hot-toast";

import Button from "Components/Button/Button";
import Modal from "Components/Modal/Modal";
import InputControl from "Components/InputControl/InputControl";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";

import { getAllSongs } from "apis/song";
import { createRoom } from "apis/room";

import styles from "./CreateRoomModal.module.scss";

function CreateRoomModal({ onClose, onSuccess }) {
  const [values, setValues] = useState({
    name: "",
  });
  const [errors, setErrors] = useState({
    name: "",
  });
  const [allSongs, setAllSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);

  const fetchAllSongs = async () => {
    const res = await getAllSongs();
    if (!res) return;

    setAllSongs(res.data);
  };

  const validateForm = () => {
    let errors = {};

    if (!values.name || !values.name.trim()) errors.name = "Name required";
    if (!selectedSongs.length) errors.songs = "select some songs to continue";

    if (Object.keys(errors).length) {
      setErrors(errors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  };

  const handleSubmission = async () => {
    if (!validateForm()) return;

    const body = {
      name: values.name,
      playlist: selectedSongs.map((item) => item.value),
    };

    setSubmitButtonDisabled(true);
    const res = await createRoom(body);
    setSubmitButtonDisabled(false);
    if (!res) return;

    toast.success("Room created successfully!");

    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  useEffect(() => {
    fetchAllSongs();
  }, []);

  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.form}>
          <InputControl
            label="Room name"
            placeholder="Enter room name"
            maxLength={50}
            value={values.name}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, name: event.target.value }))
            }
            error={errors.name}
          />

          <InputSelect
            label="Playlist"
            placeholder="Select songs"
            value={""}
            options={allSongs
              .filter((item) => !selectedSongs.some((s) => s.value == item._id))
              .map((item) => ({
                value: item._id,
                label: item.title,
              }))}
            onChange={(song) => setSelectedSongs((prev) => [...prev, song])}
          />

          <div className={styles.songs}>
            {selectedSongs.map((item) => (
              <div key={item.value} className={styles.song}>
                <p>{item.label}</p>

                <div
                  className={"icon"}
                  onClick={() =>
                    setSelectedSongs((prev) =>
                      prev.filter((s) => s.value !== item.value)
                    )
                  }
                >
                  <X />
                </div>
              </div>
            ))}
          </div>
        </div>

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
    </Modal>
  );
}

export default CreateRoomModal;
