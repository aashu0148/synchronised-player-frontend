import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronUp, Headphones, LogOut, Pause, Play } from "react-feather";
import { toast } from "react-hot-toast";
import Dexie from "dexie";

import Button from "Components/Button/Button";
import PlayerDetailsModal from "./PlayerDetailsModal/PlayerDetailsModal";

import {
  formatSecondsToMinutesSeconds,
  getFileHashSha256,
  shuffleArray,
} from "utils/util";
import actionTypes from "store/actionTypes";
import {
  nextPlayIcon,
  pauseIcon,
  playIcon,
  previousPlayIcon,
} from "utils/svgs";
import { getAllSongs } from "apis/song";
import { sayHiToBackend } from "apis/user";

import styles from "./Player.module.scss";

const socketEventEnum = {
  playPause: "play-pause",
  updatePlaylist: "update-playlist",
  seek: "seek",
  prev: "prev",
  next: "next",
  playSong: "play-song",
  addSong: "add-song",
  notification: "notification",
  chat: "chat",
  usersChange: "users-change",
  joinedRoom: "joined-room",
};
let DB = new Dexie("sleeping-owl-music");
DB.version(1).stores({
  audios: "++id,file,hash,url,name,createdAt",
});

let debounceTimeout,
  bufferCheckingInterval,
  globalBufferingVariable = false;
let progressDetails = {
  mouseDown: false,
  progress: NaN,
  song: {},
  roomId: "",
};
function Player({ socket }) {
  const audioElemRef = useRef();

  const dispatch = useDispatch();
  const roomDetails = useSelector((state) => state.root.room);
  const userDetails = useSelector((state) => state.root.user);
  const isMobileView = useSelector((state) => state.root.mobileView);
  const lastSongUploadedTime = useSelector(
    (state) => state.root.songUploadedTimestamp
  );

  const [availableSongs, setAvailableSongs] = useState([]);
  const [inputElemProgress, setInputElemProgress] = useState(0);
  const [audioElemCurrTime, setAudioElemCurrTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
  const [roomNotifications, setRoomNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const isPlayerActive = roomDetails?._id ? true : false;
  const currentSong =
    isPlayerActive && roomDetails?.playlist?.length
      ? roomDetails.playlist.find(
          (item) => item._id == roomDetails.currentSong
        ) || {}
      : {};
  const secondsPlayed = progressDetails.mouseDown
    ? (inputElemProgress / 100) * currentSong.length || 0
    : audioElemCurrTime;
  const progressPercent = progressDetails.mouseDown
    ? inputElemProgress
    : parseInt((audioElemCurrTime / currentSong?.length) * 100) || 0;

  const debounce = (func, time = 200) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, time);
  };

  const handleProgressChange = (prog) => {
    const length = progressDetails.song?.length;
    const seekedTo = parseInt((prog / 100) * length);

    const audio = audioElemRef.current;
    if (audio) {
      pauseAudio(audio);
      audio.currentTime = seekedTo;
    }

    console.log("🟡seek event emitted");
    socket.emit(socketEventEnum.seek, {
      seekSeconds: seekedTo,
      roomId: progressDetails.roomId,
      userId: userDetails._id,
    });
  };

  const handlePlayPauseToggle = () => {
    if (isBuffering) return;

    console.log("🟡play-pause event emitted");
    socket.emit(socketEventEnum.playPause, {
      roomId: roomDetails._id,
      userId: userDetails._id,
    });
  };

  const handlePlayNewSong = (songId) => {
    if (!songId) return;

    console.log("🟡play-song event emitted");
    socket.emit(socketEventEnum.playSong, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      songId,
    });
    setIsBuffering(true);
  };

  const handleAddSong = (songId) => {
    if (!songId) return;
    const song = availableSongs.find((item) => item._id == songId);
    if (!song) return;

    console.log("🟡add-song event emitted");
    socket.emit(socketEventEnum.addSong, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      song,
    });
  };

  const handleDeleteSong = (songId) => {
    if (!songId) return;
    const newSongIds = roomDetails.playlist
      .filter((item) => item._id !== songId)
      .map((item) => item._id);

    if (songId == currentSong._id) {
      // pauseAudio(audioElemRef.current);
      audioElemRef.current.src = "";
    }

    console.log("🟡update-playlist event emitted for deleting song");
    socket.emit(socketEventEnum.updatePlaylist, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      songIds: newSongIds,
    });
  };

  const handleReorderPlaylist = (songIds) => {
    if (!Array.isArray(songIds) || typeof songIds[0] !== "string") return;

    console.log("🟡update-playlist event emitted for reordering");
    socket.emit(socketEventEnum.updatePlaylist, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      songIds: songIds,
    });
  };

  const handlePreviousClick = () => {
    console.log("🟡prev event emitted");
    socket.emit(socketEventEnum.prev, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      currentSongId: roomDetails.currentSong,
    });
  };

  const handleNextClick = () => {
    console.log("🟡next event emitted");
    socket.emit(socketEventEnum.next, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      currentSongId: roomDetails.currentSong,
    });
  };

  const handleSendMessage = (msg) => {
    setChatUnreadCount(0);

    console.log(`🟡${socketEventEnum.chat} event emitted`);
    socket.emit(socketEventEnum.chat, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      message: msg,
      timestamp: Date.now(),
    });
  };

  const handleShufflePlaylist = () => {
    const newSongIds = shuffleArray(roomDetails.playlist).map(
      (item) => item._id
    );

    console.log(`🟡${socketEventEnum.updatePlaylist} event emitted to shuffle`);
    socket.emit(socketEventEnum.updatePlaylist, {
      roomId: roomDetails._id,
      userId: userDetails._id,
      songIds: newSongIds,
    });
  };

  const handleLeaveRoomClick = () => {
    socket.emit("leave-room", {
      roomId: roomDetails._id,
      userId: userDetails._id,
    });
  };

  const handleSocketEvents = () => {
    socket.on(socketEventEnum.seek, (data) => {
      if (isNaN(data?.secondsPlayed)) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on(socketEventEnum.playPause, (data) => {
      if (!data) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on(socketEventEnum.prev, (data) => {
      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on(socketEventEnum.next, (data) => {
      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on(socketEventEnum.playSong, (data) => {
      if (!data.currentSong) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on(socketEventEnum.addSong, (data) => {
      if (!data.playlist?.length) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
      toast.success(`New song added`);
    });

    socket.on(socketEventEnum.updatePlaylist, (data) => {
      if (!data.playlist?.length) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
      toast.success(`Playlist updated`);
    });

    socket.on(socketEventEnum.notification, (msg) => {
      setRoomNotifications((prev) => [
        ...prev,
        typeof msg == "object" ? { ...msg, timestamp: Date.now() } : {},
      ]);
    });

    socket.on(socketEventEnum.chat, (data) => {
      if (!Array.isArray(data?.chats)) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
      setChatUnreadCount((prev) => prev + 1);
    });

    socket.on(socketEventEnum.usersChange, (data) => {
      if (!data?.users?.length) return;

      dispatch({
        type: actionTypes.UPDATE_ROOM,
        room: { users: data.users },
      });
    });

    socket.on("left-room", () => {
      if (audioElemRef.current) audioElemRef.current?.pause();

      dispatch({ type: actionTypes.DELETE_ROOM });
    });

    socket.on(socketEventEnum.joinedRoom, (data) => {
      if (!Object.keys(data)?.length) return;

      setRoomNotifications([]);
      dispatch({ type: actionTypes.ADD_ROOM, room: data });
      console.log("🟢 Room joined", data.name);
    });
  };

  const handleInputMousedown = () => {
    progressDetails.mouseDown = true;
    progressDetails.song = currentSong;
    progressDetails.roomId = roomDetails._id;
  };

  const handleMouseUp = () => {
    if (!progressDetails.mouseDown) return;

    const progress = progressDetails.progress;
    progressDetails.mouseDown = false;
    progressDetails.progress = NaN;

    if (isNaN(progress)) return;

    handleProgressChange(progress);
  };

  const handleAudioTimeUpdate = (event) => {
    if (progressDetails.mouseDown) return;

    const currSeconds = event.target.currentTime;

    if (parseInt(currSeconds) >= parseInt(currentSong.length))
      handleNextClick();
    setAudioElemCurrTime(currSeconds);
  };

  const playAudio = (audio, buffering = isBuffering) => {
    debounce(() => {
      if (!buffering) audio.play();
    }, 200);
  };

  const pauseAudio = (audio, buffering = isBuffering) => {
    debounce(() => {
      if (!buffering) audio.pause();
    }, 200);
  };

  const updateAudioElementWithControls = async (room) => {
    if (!Object.keys(room).length) return;
    if (!currentSong?.url) {
      toast.error("current song url not found!");
      return;
    }

    const audio = audioElemRef.current;

    if (audio.dataset.hash !== currentSong?.hash) {
      const fileRes = await getAudioFromIndexDB(currentSong.hash);
      if (fileRes && fileRes?.file) {
        audio.src = fileRes.file;
        audio.dataset.hash = fileRes.hash;
        audio.load();
        setIsBuffering(true);
        clearTimeout(debounceTimeout);
        return;
      }

      audio.dataset.hash = currentSong.hash;
      audio.src = currentSong.url;
      audio.load();
      setIsBuffering(true);
      clearTimeout(debounceTimeout);

      getAudioFileFromUrlAndStore(currentSong.url, currentSong.title);
    } else {
      if (room.paused) pauseAudio(audio);
      else playAudio(audio);
    }

    audio.currentTime = room.secondsPlayed;
    setAudioElemCurrTime(room.secondsPlayed);
  };

  const handleCanPlayEvent = (event, playNow = false) => {
    setIsBuffering(false);

    if (playNow) playAudio(event.target, false);
  };

  const checkForBuffering = () => {
    const audio = audioElemRef.current;
    if (!audio) return;

    if (globalBufferingVariable && audio.readyState >= 1)
      playAudio(audio, false);
  };

  const fetchAllSongs = async () => {
    const res = await getAllSongs();
    if (!res) return;

    setAvailableSongs(res.data);
  };

  const readFileAsUrl = async (file) => {
    const reader = new FileReader();

    return new Promise((res) => {
      reader.onload = function (e) {
        res(e.target.result);
      };

      reader.onerror = () => res(null);

      reader.readAsDataURL(file);
    });
  };

  const getAudioFileFromUrlAndStore = async (url, name) => {
    try {
      const res = await fetch(url);
      if (res.status !== 200 || !res.ok) return;

      const blob = await res.blob();
      const hash = await getFileHashSha256(blob);

      if (!blob || !hash) return;

      addAudioToIndexDB(blob, hash, url, name);
    } catch (err) {
      console.log("Error getting file from URL:", url, err);
    }
  };

  const addAudioToIndexDB = async (file, hash, url, name) => {
    try {
      const fileInDbRes = await DB.audios
        .where("hash")
        .equalsIgnoreCase(hash)
        .toArray();

      const fileInDb = fileInDbRes[0];
      if (fileInDb) return;

      const fileAsUrl = await readFileAsUrl(file);

      await DB.audios.add({
        url: url,
        hash: hash,
        file: fileAsUrl,
        name,
        createdAt: Date.now(),
      });

      console.log(`🟢ADDED ${name} to db`);
      return true;
    } catch (e) {
      console.log(`🔴Error accessing file: ${e}`);
    }
  };

  const getAudioFromIndexDB = async (hash) => {
    if (!hash) return null;

    try {
      const files = await DB.audios
        .where("hash")
        .equalsIgnoreCase(hash)
        .toArray();

      const file = files[0];

      return file;
    } catch (e) {
      console.log(`🔴Error accessing file: ${e}`);
      return null;
    }
  };

  const cleanIndexDBIfNeeded = () => {
    // TODO -> clear out some storage if taking too much of the space
  };

  const greetBackend = async () => {
    await sayHiToBackend();
  };

  useEffect(() => {
    if (isFirstRender) return;

    updateAudioElementWithControls(roomDetails);
  }, [roomDetails.currentSong, roomDetails.secondsPlayed, roomDetails.paused]);

  useEffect(() => {
    globalBufferingVariable = isBuffering;
  }, [isBuffering]);

  useEffect(() => {
    fetchAllSongs();
  }, [lastSongUploadedTime]);

  useEffect(() => {
    setIsFirstRender(false);
    cleanIndexDBIfNeeded();

    setInterval(greetBackend, 120 * 1000);

    if (bufferCheckingInterval) {
      clearInterval(bufferCheckingInterval);
      bufferCheckingInterval = null;
      bufferCheckingInterval = setInterval(checkForBuffering, 2000);
    } else {
      bufferCheckingInterval = setInterval(checkForBuffering, 2000);
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    handleSocketEvents();

    return () => {
      try {
        Object.values(socketEventEnum).forEach((e) => socket.off(e));
      } catch (err) {
        console.log("error removing socket events", err);
      }
    };
  }, [socket]);

  const dotLoadingDiv = (
    <div className={styles.dotLoading}>
      <div className={styles.dot} />
    </div>
  );

  return (
    <div
      className={`${styles.container} ${isPlayerActive ? "" : styles.inactive}`}
    >
      {showMoreDetailsModal && (
        <PlayerDetailsModal
          onClose={() => setShowMoreDetailsModal(false)}
          notifications={roomNotifications}
          onToggleCurrentSong={handlePlayPauseToggle}
          onPlayNewSong={handlePlayNewSong}
          onDeleteSong={handleDeleteSong}
          allSongs={availableSongs}
          onAddNewSong={handleAddSong}
          onReorderPlaylist={handleReorderPlaylist}
          onShufflePlaylist={handleShufflePlaylist}
          onMessageSent={handleSendMessage}
          chatUnreadCount={chatUnreadCount}
          updateChatUnreadCount={(c) => (isNaN(c) ? "" : setChatUnreadCount(c))}
        />
      )}
      <div className={styles.inactiveOverlay} />

      {isMobileView && (
        <div className={styles.topBar}>
          <div
            className={styles.expandButton}
            onClick={() => setShowMoreDetailsModal(true)}
          >
            {chatUnreadCount > 0 && (
              <span className={styles.unreadCount}>{chatUnreadCount}</span>
            )}

            <ChevronUp />
          </div>

          <p className={styles.name}>{currentSong.title}</p>

          <div className={styles.logoutButton} onClick={handleLeaveRoomClick}>
            <LogOut />
          </div>
        </div>
      )}

      <audio
        ref={audioElemRef}
        style={{ display: "none" }}
        controls
        onTimeUpdate={handleAudioTimeUpdate}
        onPlaying={() => {
          setIsBuffering(false);
        }}
        onWaiting={() => {
          setIsBuffering(true);
        }}
        onCanPlay={handleCanPlayEvent}
        onCanPlayThrough={handleCanPlayEvent}
        onLoadedMetadata={(e) => handleCanPlayEvent(e, true)}
      />

      <div className={styles.left}>
        <div className={styles.name}>
          <div>
            <Headphones />
          </div>

          <p className={styles.title}>{currentSong.title}</p>
        </div>
        <p className={styles.desc}>{currentSong.artist}</p>
      </div>

      <div className={styles.controller}>
        <div className={styles.buttons}>
          <div
            className={`${styles.button} ${styles.prev}`}
            onClick={handlePreviousClick}
          >
            {previousPlayIcon}
          </div>
          <div
            className={`${styles.button} ${styles.play}`}
            onClick={handlePlayPauseToggle}
          >
            {isBuffering
              ? dotLoadingDiv
              : roomDetails.paused
              ? playIcon
              : pauseIcon}
          </div>
          <div
            className={`${styles.button} ${styles.next}`}
            onClick={handleNextClick}
          >
            {nextPlayIcon}
          </div>
        </div>

        <div className={styles.progressContainer}>
          <p className={styles.time}>
            {formatSecondsToMinutesSeconds(secondsPlayed)}
          </p>

          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${progressPercent}%` }}
            />

            <input
              type="range"
              onMouseDown={handleInputMousedown}
              onTouchStart={handleInputMousedown}
              onChange={(event) => {
                const prog = parseInt(event.target.value);
                progressDetails.progress = prog;
                setInputElemProgress(prog);
              }}
            />
          </div>

          <p className={styles.time}>
            {formatSecondsToMinutesSeconds(currentSong.length)}
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <p className={styles.title}>{roomDetails.name}</p>

        <div className={styles.btns}>
          <div className={styles.moreButton}>
            {chatUnreadCount > 0 && (
              <span className={styles.unreadCount}>{chatUnreadCount}</span>
            )}
            <Button
              className={`${styles.moreBtn} ${styles.btn}`}
              outlineButton
              onClick={() => setShowMoreDetailsModal(true)}
            >
              More details
            </Button>
          </div>

          <Button
            className={styles.btn}
            outlineButton
            onClick={handleLeaveRoomClick}
          >
            <LogOut />{" "}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Player;
