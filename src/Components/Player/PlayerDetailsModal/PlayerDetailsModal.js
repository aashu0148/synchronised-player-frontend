import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Headphones, Send, Shuffle, X } from "react-feather";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

import Modal from "Components/Modal/Modal";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import Button from "Components/Button/Button";

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
  onShufflePlaylist,
  onMessageSent,
  chatUnreadCount = 0,
  updateChatUnreadCount,
}) {
  const messagesRef = useRef();
  const tabsEnum = {
    playlist: "playlist",
    users: "users",
    chat: "chat",
    activity: "activity",
  };
  const userDetails = useSelector((state) => state.root.user);
  const roomDetails = useSelector((state) => state.root.room);

  const [activeTab, setActiveTab] = useState(tabsEnum.playlist);
  const [playlist, setPlaylist] = useState(roomDetails.playlist || []);
  const [inputMessage, setInputMessage] = useState("");

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

  const handleChatSubmission = () => {
    if (!inputMessage || !inputMessage.trim()) return;

    const msg = inputMessage;
    setInputMessage("");

    if (onMessageSent) onMessageSent(msg);
  };

  useEffect(() => {
    if (activeTab == tabsEnum.chat) {
      if (messagesRef.current) {
        messagesRef.current.scrollTo({
          top: messagesRef.current.scrollHeight,
        });
        if (updateChatUnreadCount) updateChatUnreadCount(0);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
      if (updateChatUnreadCount) updateChatUnreadCount(0);
    }
  }, [roomDetails.chats?.length]);

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
              <div className="row" style={{ alignItems: "flex-end" }}>
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

                <Button className={styles.shuffle} onClick={onShufflePlaylist}>
                  <Shuffle />
                  Shuffle
                </Button>
              </div>

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
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                        >
                          <div className={styles.left}>
                            <div
                              className={styles.drag}
                              {...provided.dragHandleProps}
                            >
                              {dragIcon}
                            </div>

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
    [playlist, roomDetails.currentSong]
  );

  // const playlistDivWithoutDnd = useMemo(
  //   () => (
  //     <div className={styles.playlist}>
  //       <InputSelect
  //         label="Add new song"
  //         placeholder="Select song"
  //         value=""
  //         options={allSongs
  //           .filter(
  //             (item) => !roomDetails.playlist.some((s) => s._id == item._id)
  //           )
  //           .map((item) => ({
  //             value: item._id,
  //             label: item.title,
  //           }))}
  //         onChange={(song) => (onAddNewSong ? onAddNewSong(song.value) : "")}
  //       />

  //       {Array.isArray(roomDetails.playlist)
  //         ? playlist.map((item, i) => (
  //             <div
  //               className={`${styles.song} ${
  //                 roomDetails.currentSong == item._id ? styles.playing : ""
  //               }`}
  //               key={item._id}
  //             >
  //               <div className={styles.left}>
  //                 <div className={styles.drag}>{dragIcon}</div>

  //                 <div
  //                   className={styles.play}
  //                   onClick={() =>
  //                     onToggleCurrentSong && onPlayNewSong
  //                       ? roomDetails.currentSong == item._id
  //                         ? onToggleCurrentSong()
  //                         : onPlayNewSong(item._id)
  //                       : ""
  //                   }
  //                 >
  //                   {roomDetails.currentSong == item._id
  //                     ? roomDetails.paused
  //                       ? playIcon
  //                       : pauseIcon
  //                     : playIcon}
  //                 </div>

  //                 <div className={styles.details}>
  //                   <p className={styles.title}>
  //                     <span>
  //                       {roomDetails.currentSong == item._id ? (
  //                         musicBar
  //                       ) : (
  //                         <Headphones />
  //                       )}
  //                     </span>
  //                     {item.title}
  //                   </p>

  //                   <p className={styles.desc}>{item.artist}</p>
  //                 </div>
  //               </div>
  //               <div
  //                 className={`icon ${styles.deleteIcon}`}
  //                 onClick={() => (onDeleteSong ? onDeleteSong(item._id) : "")}
  //               >
  //                 <X />
  //               </div>
  //             </div>
  //           ))
  //         : ""}
  //     </div>
  //   ),
  //   [playlist, roomDetails.currentSong]
  // );

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

  const getMessageDiv = (chat = {}, isRight = false, isConcurrent = false) => {
    return (
      <div
        className={`${styles.message} ${isRight ? styles.rightMessage : ""} ${
          isConcurrent ? styles.concurrent : ""
        }`}
        style={{ marginTop: isConcurrent ? "" : "10px" }}
      >
        {!isConcurrent ? (
          <div className={styles.image}>
            <img
              src={chat.user?.profileImage}
              alt={chat.user?.name}
              rel="no-referrer"
            />
          </div>
        ) : (
          <div className={styles.image}>
            <div className={styles.imagePlaceholder} />
          </div>
        )}

        <div className={`${styles.inner}`}>
          {!isConcurrent && <p className={styles.name}>{chat.user?.name}</p>}
          <p className={styles.text}>{chat.message}</p>
        </div>
      </div>
    );
  };

  const chatDiv = useMemo(
    () => (
      <div className={styles.chatBox}>
        <div className={styles.messages} ref={messagesRef}>
          {Array.isArray(roomDetails.chats) && roomDetails.chats.length ? (
            roomDetails.chats.map((item, index) =>
              getMessageDiv(
                item,
                item.user?._id == userDetails._id,
                index > 0 &&
                  roomDetails.chats[index - 1].user?._id == item.user?._id
              )
            )
          ) : (
            <p className={styles.empty}>No chats present for now!</p>
          )}
        </div>
        <div className={styles.footer}>
          <input
            placeholder="Type something..."
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyUp={(event) =>
              event.key == "Enter" && !event.shiftKey
                ? handleChatSubmission()
                : ""
            }
          />
          <Button onClick={handleChatSubmission}>
            <Send />
          </Button>
        </div>
      </div>
    ),
    [roomDetails.chats, inputMessage]
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

  // console.log("room", roomDetails);

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

              {item == tabsEnum.chat && chatUnreadCount > 0 ? (
                <span className={styles.count}>{chatUnreadCount}</span>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>

        {activeTab == tabsEnum.playlist
          ? playlistDiv
          : activeTab == tabsEnum.users
          ? usersDiv
          : activeTab == tabsEnum.chat
          ? chatDiv
          : activeTab == tabsEnum.activity
          ? activityDiv
          : ""}
      </div>
    </Modal>
  );
}

export default PlayerDetailsModal;
