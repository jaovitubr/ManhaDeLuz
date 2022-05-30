import filesystem from 'react-native-fs';
import events from 'events';
import RNFetchBlob from 'rn-fetch-blob';
import config from "../../app.json";

let sndcld_dl = function (url, path, client_id) {
    const eventEmitter = new events.EventEmitter();

    this.url = url;
    this.path = path;
    this.client_id = client_id;

    const sndcld = function () {
        this.user_agent = config.soundcloud_fetch_user_agent;
        this.headers = {
            "User-Agent": this.user_agent
        };
    };

    sndcld.prototype.get_playlist = function (url, client_id, callback) {
        try {
            let headers = this.headers;

            let track_url_callback = function (body) {
                try {
                    let json = JSON.parse(body);
                    let playlist_url = json.url;

                    fetch(playlist_url, {
                        method: "GET",
                        headers: headers
                    }).then(response => response.text()).then(callback);
                } catch (ex) {
                    eventEmitter.emit("error", "get_playlist error1: " + ex);
                }
            };

            const url_callback = function (body) {
                try {
                    let pattern = /"https:\/\/api\-v2\.soundcloud\.com\/media\/soundcloud:tracks:(\d+)\/([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})\/stream\/hls"/;
                    let matches = body.match(pattern);

                    let track_id = Number(matches[1]);
                    let uuid = matches[2];
                    let track_url = "https://api-v2.soundcloud.com/media/soundcloud:tracks:" +
                        track_id + "/" + uuid + "/stream/hls?client_id=" + client_id;

                    console.log(track_url);

                    fetch(track_url, {
                        method: "GET",
                        headers: headers
                    }).then(response => response.text()).then(track_url_callback);
                } catch (ex) {
                    eventEmitter.emit("error", "get_playlist error2: " + ex);
                }
            };

            if (url.endsWith("/stream/hls")) {
                console.log("OTHER", url + "?client_id=" + client_id);
                fetch(url + "?client_id=" + client_id, {
                    method: "GET",
                    headers: headers
                }).then(response => response.text()).then(track_url_callback);
            } else {
                fetch(url, {
                    method: "GET",
                    headers: headers
                }).then(response => response.text()).then(url_callback);
            }
        } catch (ex) {
            eventEmitter.emit("error", "get_playlist error3: " + ex);
        }
    };

    sndcld.prototype.get_malformed_url = function (playlist, callback) {
        try {
            let url = playlist.split("\n").slice(-2, -1)[0];
            let url_parts = url.split("/");
            let malformed_url = url_parts.slice(0, 4).join("/") + "/0/" + url_parts.slice(5).join("/");

            callback(malformed_url);
        } catch (ex) {
            eventEmitter.emit("error", "get_malformed_url error: " + ex);
        }
    };

    this.sndcld = new sndcld();

    (function () {
        let sndcld = this.sndcld;
        let path = this.path;

        const get_malformed_url_callback = function (malformed_url) {
            try {
                RNFetchBlob.config({
                    fileCache: true,
                    appendExt: 'mp3',
                }).fetch('GET', malformed_url, {
                    "User-Agent": sndcld.user_agent
                }).progress((received, total) => {
                    eventEmitter.emit("progress", received / total);
                }).then(async (res) => {
                    const old_file_name = res.path();
                    const new_file_name = old_file_name.replace(/\/\w+\.mp3/g, "/manha_de_luz.mp3");

                    if (await filesystem.exists(new_file_name)) filesystem.unlink(new_file_name);
                    await filesystem.moveFile(old_file_name, new_file_name);

                    eventEmitter.emit("end", new_file_name);
                }).catch((errorMessage) => {
                    console.log(errorMessage);
                    eventEmitter.emit("error", `get_malformed_url_callback request error: ${errorMessage}`);
                })
            } catch (ex) {
                eventEmitter.emit("error", "get_malformed_url_callback error: " + ex);
            }
        };

        const get_playlist_callback = function (playlist) {
            sndcld.get_malformed_url(playlist, get_malformed_url_callback);
        };

        sndcld.get_playlist(this.url, this.client_id, get_playlist_callback);
    })();

    return eventEmitter;
};

export default sndcld_dl;