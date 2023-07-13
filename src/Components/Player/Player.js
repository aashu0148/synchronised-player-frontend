import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronUp, Headphones, LogOut, Pause, Play } from "react-feather";
import { toast } from "react-hot-toast";
import Dexie from "dexie";

import Button from "Components/Button/Button";
import PlayerDetailsModal from "./PlayerDetailsModal/PlayerDetailsModal";

import { formatSecondsToMinutesSeconds, getFileHashSha256 } from "utils/util";
import actionTypes from "store/actionTypes";
import {
  nextPlayIcon,
  pauseIcon,
  playIcon,
  previousPlayIcon,
} from "utils/svgs";

import styles from "./Player.module.scss";

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

  const [inputElemProgress, setInputElemProgress] = useState(0);
  const [audioElemCurrTime, setAudioElemCurrTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
  const [roomNotifications, setRoomNotifications] = useState([]);

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

    socket.emit("seek", {
      seekSeconds: seekedTo,
      roomId: progressDetails.roomId,
      userId: userDetails._id,
    });
  };

  const handlePlayPauseToggle = () => {
    if (isBuffering) return;

    socket.emit("play-pause", {
      roomId: roomDetails._id,
      userId: userDetails._id,
    });
  };

  const handlePreviousClick = () => {
    socket.emit("prev", {
      roomId: roomDetails._id,
      userId: userDetails._id,
      currentSongId: roomDetails.currentSong,
    });
  };

  const handleNextClick = () => {
    socket.emit("next", {
      roomId: roomDetails._id,
      userId: userDetails._id,
      currentSongId: roomDetails.currentSong,
    });
  };

  const handleLeaveRoomClick = () => {
    socket.emit("leave-room", {
      roomId: roomDetails._id,
      userId: userDetails._id,
    });
  };

  const handleSocketEvents = () => {
    socket.on("seek", (data) => {
      if (isNaN(data?.secondsPlayed)) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on("play-pause", (data) => {
      if (!data) return;

      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on("prev", (data) => {
      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on("next", (data) => {
      dispatch({ type: actionTypes.UPDATE_ROOM, room: data });
    });

    socket.on("notification", (msg) => {
      setRoomNotifications((prev) => [
        ...prev,
        typeof msg == "object" ? { ...msg, timestamp: Date.now() } : {},
      ]);
    });

    socket.on("left-room", () => {
      if (audioElemRef.current) audioElemRef.current?.pause();

      dispatch({ type: actionTypes.DELETE_ROOM });
    });

    socket.on("users-change", (data) => {
      if (!data?._id) return;

      dispatch({
        type: actionTypes.UPDATE_ROOM,
        room: { users: data.users },
      });
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

    if (globalBufferingVariable && audio.readyState >= 1)
      playAudio(audio, false);
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

  useEffect(() => {
    if (isFirstRender) return;

    updateAudioElementWithControls(roomDetails);
  }, [roomDetails.currentSong, roomDetails.secondsPlayed, roomDetails.paused]);

  useEffect(() => {
    globalBufferingVariable = isBuffering;
  }, [isBuffering]);

  useEffect(() => {
    setIsFirstRender(false);
    handleSocketEvents();

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
        />
      )}
      <div className={styles.inactiveOverlay} />

      {isMobileView && (
        <div className={styles.topBar}>
          <div
            className={styles.expandButton}
            onClick={() => setShowMoreDetailsModal(true)}
          >
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
          <Button
            className={`${styles.moreBtn} ${styles.btn}`}
            outlineButton
            onClick={() => setShowMoreDetailsModal(true)}
          >
            More details
          </Button>
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
