import { errorToastLogger, fetchWrapper } from "utils/util";

export const getAllRooms = async () => {
  const reqPath = `/room/all`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getAllRooms",
        data?.message || "Failed to get rooms",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getAllRooms", "Failed to get rooms", err);
    return false;
  }
};

export const createRoom = async (values) => {
  const reqPath = `/room`;
  let response;

  try {
    response = await fetchWrapper(reqPath, values);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "createRoom",
        data?.message || "Failed to create new room",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("createRoom", "Failed to create new room", err);
    return false;
  }
};

export const updateRoom = async (rid, values) => {
  const reqPath = `/room/${rid}`;
  let response;

  try {
    response = await fetchWrapper(reqPath, values, "", "PUT");
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "updateRoom",
        data?.message || "Failed to update room",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("updateRoom", "Failed to update room", err);
    return false;
  }
};

export const deleteRoom = async (rid) => {
  const reqPath = `/room/${rid}`;
  let response;

  try {
    response = await fetchWrapper(reqPath, "", "", "DELETE");
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "deleteRoom",
        data?.message || "Failed to delete room",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("deleteRoom", "Failed to delete room", err);
    return false;
  }
};
