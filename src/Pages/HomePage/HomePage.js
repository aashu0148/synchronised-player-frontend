import React, { useEffect, useState } from "react";
import io from "socket.io-client";

import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";
import CreateRoomModal from "./CreateRoomModal/CreateRoomModal";

import { getAllRooms } from "apis/room";
import { getRandomInteger } from "utils/util";

import styles from "./HomePage.module.scss";

const lightColors = [
  "#fff",
  "#fff4fb",
  "#F9F5F6",
  "#AEE2FF",
  "#FBFFDC",
  "#F9FBE7",
  "#E6FFFD",
  "#ECF2FF",
  "#ECF9FF",
  "#FAF8F1",
  "#EFFFFD",
  "#ffffff",
];
const backendUrl = process.env.REACT_APP_BACKEND_URL;
let socket;
function HomePage() {
  const [loadingPage, setLoadingPage] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [openModals, setOpenModals] = useState({
    create: false,
  });

  const fetchAllRooms = async () => {
    const res = await getAllRooms();
    setLoadingPage(false);
    if (!res?.data) return;

    setRooms(
      res.data.map((item) => ({
        ...item,
        color: lightColors[getRandomInteger(0, lightColors.length - 1)],
      }))
    );
  };

  const handleSocketConnection = () => {
    socket.on("connect", () => {
      console.log("Connection", socket);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected", socket);
    });
  };

  useEffect(() => {
    socket = io(backendUrl);
    handleSocketConnection();
    fetchAllRooms();

    return () => {
      socket.disconnect();
    };
  }, []);

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      {openModals.create && (
        <CreateRoomModal
          onClose={() => setOpenModals((prev) => ({ ...prev, create: false }))}
          onSuccess={() => fetchAllRooms()}
        />
      )}

      <div className={styles.header}>
        <p className={styles.title}>Available Rooms</p>

        <Button
          onClick={() => setOpenModals((prev) => ({ ...prev, create: true }))}
        >
          + Create room
        </Button>
      </div>

      <div className={styles.rooms}>
        {rooms.length ? (
          rooms.map((item) => (
            <div
              className={styles.room}
              key={item._id}
              style={{ backgroundColor: item.color }}
            >
              <p className={styles.title}>{item.name}</p>

              <div className={styles.playlist}>
                <label>Few songs from this room</label>

                <div className={styles.songs}>
                  {item.playlist.length ? (
                    item.playlist
                      .slice(0, 5)
                      .map((s) => <div className={styles.song}>{s.title}</div>)
                  ) : (
                    <p>No songs for now!</p>
                  )}
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.user}>
                  <div className={styles.image}>
                    <img src={item.owner.profileImage} alt={item.owner.name} />
                  </div>

                  <p className={styles.name}>{item.owner.name}</p>
                </div>

                <div className={styles.buttons}>
                  {/* <Button redButton>Delete room</Button> */}

                  <Button>Join room</Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No rooms found!</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
