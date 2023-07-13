import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Headphones, X } from "react-feather";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

import Modal from "Components/Modal/Modal";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";

import { dragIcon, pauseIcon, playIcon } from "utils/svgs";
import { getTimeFormatted } from "utils/util";

import styles from "./PlayerDetailsModal.module.scss";

function PlayerDetailsModal({
  onClose,
  notifications = [],
  allSongs = [],
  onToggleCurrentSong,
  onPlayNewSong,
  onDeleteSong,
  onAddNewSong,
  onReorderPlaylist,
}) {
  const tabsEnum = {
    playlist: "playlist",
    users: "users",
    activity: "activity",
  };
  const roomDetails = useSelector((state) => state.root.room);

  const [activeTab, setActiveTab] = useState(tabsEnum.playlist);
  const [playlist, setPlaylist] = useState(roomDetails.playlist || []);

  const handleDragEnd = (dragObj) => {
    const si = dragObj.source?.index;
    const di = dragObj.destination?.index;
    if (isNaN(di) || isNaN(si)) return;

    const tempPlaylist = [...playlist];
    const sElement = tempPlaylist[si];
    tempPlaylist.splice(si, 1);
    tempPlaylist.splice(di, 0, sElement);

    setPlaylist(tempPlaylist);
    if (onReorderPlaylist)
      onReorderPlaylist(tempPlaylist.map((item) => item._id));
  };

  useEffect(() => {
    setPlaylist(roomDetails.playlist);
  }, [roomDetails.playlist]);

  const musicBar = (
    <div className={styles.musicBar}>
      <span />
      <span />
      <span />
    </div>
  );

  const playlistDiv = useMemo(
    () => (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="playlist-droppable">
          {(provided) => (
            <div
              className={styles.playlist}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <InputSelect
                label="Add new song"
                placeholder="Select song"
                value=""
                options={allSongs
                  .filter(
                    (item) =>
                      !roomDetails.playlist.some((s) => s._id == item._id)
                  )
                  .map((item) => ({
                    value: item._id,
                    label: item.title,
                  }))}
                onChange={(song) =>
                  onAddNewSong ? onAddNewSong(song.value) : ""
                }
              />

              {Array.isArray(roomDetails.playlist)
                ? playlist.map((item, i) => (
                    <Draggable key={item._id} index={i} draggableId={item._id}>
                      {(provided) => (
                        <div
                          className={`${styles.song} ${
                            roomDetails.currentSong == item._id
                              ? styles.playing
                              : ""
                          }`}
                          key={item._id}
                          {...provided.dragHandleProps}
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                        >
                          <div className={styles.left}>
                            <div className={styles.drag}>{dragIcon}</div>

                            <div
                              className={styles.play}
                              onClick={() =>
                                onToggleCurrentSong && onPlayNewSong
                                  ? roomDetails.currentSong == item._id
                                    ? onToggleCurrentSong()
                                    : onPlayNewSong(item._id)
                                  : ""
                              }
                            >
                              {roomDetails.currentSong == item._id
                                ? roomDetails.paused
                                  ? playIcon
                                  : pauseIcon
                                : playIcon}
                            </div>

                            <div className={styles.details}>
                              <p className={styles.title}>
                                <span>
                                  {roomDetails.currentSong == item._id ? (
                                    musicBar
                                  ) : (
                                    <Headphones />
                                  )}
                                </span>
                                {item.title}
                              </p>

                              <p className={styles.desc}>{item.artist}</p>
                            </div>
                          </div>
                          <div
                            className={`icon ${styles.deleteIcon}`}
                            onClick={() =>
                              onDeleteSong ? onDeleteSong(item._id) : ""
                            }
                          >
                            <X />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                : ""}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    ),
    [playlist]
  );

  const usersDiv = (
    <div className={styles.users}>
      {roomDetails.users?.length ? (
        roomDetails.users?.map((item, i) => (
          <div className={styles.user} key={item._id}>
            <div className={styles.left}>
              <div className={styles.image}>
                <img
                  src={item.profileImage}
                  alt={item.name}
                  rel="no-referrer"
                />
              </div>
              <p className={styles.name}>{item.name}</p>
            </div>

            <p className={styles.role}>
              {roomDetails.owner?._id == item._id ? "Owner" : item.role}
            </p>
          </div>
        ))
      ) : (
        <p>No activity for now!</p>
      )}
    </div>
  );

  const activityDiv = (
    <div className={styles.activityDiv}>
      {notifications.length ? (
        [...notifications].reverse().map((item, i) => (
          <div className={styles.activity} key={item.title + i}>
            <div className={styles.top}>
              <p className={styles.title}>{item.title}</p>
              <p className={styles.time}>
                {getTimeFormatted(item.timestamp, true)}
              </p>
            </div>
            <p className={styles.desc}>{item.description}</p>
          </div>
        ))
      ) : (
        <p>No activity for now!</p>
      )}
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.roomInfo}>
          <p className={styles.label}>You are listening in:</p>

          <p className={styles.room}>
            <span>
              {"“"}
              {roomDetails.name}
              {"”"}
            </span>{" "}
            by <span>{roomDetails.owner?.name}</span>
          </p>
        </div>

        <div className={styles.tabs}>
          {Object.values(tabsEnum).map((item) => (
            <div
              key={item}
              className={`${styles.tab} ${
                activeTab == item ? styles.active : ""
              }`}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </div>
          ))}
        </div>

        {activeTab == tabsEnum.playlist
          ? playlistDiv
          : activeTab == tabsEnum.users
          ? usersDiv
          : activeTab == tabsEnum.activity
          ? activityDiv
          : ""}
      </div>
    </Modal>
  );
}

export default PlayerDetailsModal;
