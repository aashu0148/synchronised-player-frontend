const getFileDownloadLinksFromSpotifyDown = async (playlistId, offset = 0) => {
  if (!playlistId) {
    console.log(`🔴Playlist Id required`);
    return;
  }

  console.log(`🟡Getting all the track list`);
  const trackListRes = await (
    await fetch(
      `https://api.spotifydown.com/trackList/playlist/${playlistId}?offset=${offset}`
    )
  ).json();
  if (!trackListRes.success) {
    console.log(`🔴Error getting trackLists`, trackListRes);
    return;
  }

  const allSongsData = trackListRes.trackList;

  const filesWithLinks = [];

  for (let i = 0; i < allSongsData.length; ++i) {
    console.log(`🟡Getting link for file:${i + 1}/${allSongsData.length}`);

    const file = allSongsData[i];
    let res;
    try {
      res = await (
        await fetch(`https://api.spotifydown.com/download/${file.id}`)
      ).json();
    } catch (err) {
      console.log("Error making request", err);
    }

    if (res?.link)
      filesWithLinks.push({
        // link: "https://corsproxy.io/?" + res.link,
        link: res.link,
        ...res.metadata,
      });
  }

  console.log(`🟢 got all files with links and meta`, filesWithLinks);
  return filesWithLinks;
};

const separateFilesByDomains = (files) => {
  const domains = files.map((item) =>
    item.link.split("?")[0].split("/").slice(0, -1).join("/")
  );

  const uniqueDomains = domains.filter(
    (item, index, self) => self.indexOf(item) == index
  );

  const filesByDomains = {};

  uniqueDomains.forEach((d) => {
    const filesWithD = files.filter((item) => item.link.startsWith(d));

    filesByDomains[d] = [...filesWithD];
  });

  return filesByDomains;
};

const downloadFilesFromLinks = async (files) => {
  if (!files.length) {
    console.log(`🔴Files required`);
    return;
  }

  function downloadFile(url, fileName) {
    console.log(`Downloading  file:${fileName}`);

    fetch(url)
      .then((response) => {
        const totalSize = response.headers.get("Content-Length");
        let downloadedSize = 0;
        let lastLoggedProgress = 0;
        const chunks = [];

        const reader = response.body.getReader();

        const pump = () => {
          return reader.read().then(({ value, done }) => {
            if (done) {
              console.log("🟢Download completed");
              const blob = new Blob(chunks);
              var link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = fileName;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              return;
            }

            downloadedSize += value.length;
            const progress = Math.floor((downloadedSize / totalSize) * 100);

            if (progress - lastLoggedProgress >= 10) {
              console.log(`${progress}% done`);
              lastLoggedProgress = progress;
            }

            chunks.push(value);
            return pump();
          });
        };

        pump();
      })
      .catch((err) => console.log("Error downloading song", err));
  }

  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    const filename = file.title + "_-_" + file.artists + ".mp3";
    downloadFile(file.link, filename);

    // request after an interval
    await new Promise((res) => setTimeout(res, 4 * 1000));
  }
};
