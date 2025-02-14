import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import events from "events";

const headers = {
    "User-Agent": "Mozilla/5.0",
    Accept: "*/*",
}

function MatchAll(text, regex) {
    if (!text || !regex) return [];

    const matches = String(text).match(regex);
    if (!matches) return [];

    return Array.from(matches).map(matched => matched.replace(regex, "$1"));
}

export async function CheckClientID(clientId) {
    if (!clientId) return false;
    const url = `https://api-v2.soundcloud.com/announcements?client_id=${encodeURIComponent(clientId)}`;

    return await fetch(url).then((resp) => resp.ok);
}

export async function GetCollection(clientId) {
    if (!clientId) return null;
    const url = `https://api-v2.soundcloud.com/users/391691502/tracks?client_id=${encodeURIComponent(clientId)}&limit=25`;

    return fetch(url).then(res => res.json()).then(data => {
        const collection = data?.collection?.find(val => val.title.toLowerCase().includes("manhã de luz"));
        if (!collection) return onError(`collection not found\n\n${data?.collection?.map(val => val.title).join("\n")}`);

        return collection;
    });
}

export function GetClientID() {
    return new Promise(async (resolve, reject) => {
        try {
            const savedClientId = await AsyncStorage.getItem("clientId");
            const isValidClientId = await CheckClientID(savedClientId);

            if (isValidClientId) return resolve(savedClientId);

            const body = await fetch("https://soundcloud.com", { headers }).then(res => res.text());
            if (!body) return reject("Não foi possível acessar o SoundCloud");
            const resourcesUrls = MatchAll(body, /src="(.*[.js|.json])"/g);

            for (const url of resourcesUrls) {
                const resourceBody = await fetch(url, { headers }).then(res => res.text());
                if (!resourceBody) continue;

                const clientIds = MatchAll(resourceBody, /client_id:"([0-9A-z]{32})"/g);

                for (const clientId of clientIds || []) {
                    if (await CheckClientID(clientId)) {
                        await AsyncStorage.setItem("clientId", clientId);
                        return resolve(clientId);
                    }
                }
            }

            reject("Não foi possível encontrar um Client ID válido");
        } catch (error) {
            reject(error);
        }
    });
}

export function SoundDownload(soundData, clientId) {
    const eventEmitter = new events.EventEmitter();

    setTimeout(async () => {
        const streamUrl = soundData.media.transcodings.find(val => val.format.protocol == "progressive").url;
        if (!streamUrl) return eventEmitter.emit("error", "Não foi possível encontrar o stream");

        const fileUrl = await fetch(`${streamUrl}?client_id=${clientId}`, { headers })
            .then(res => res.json())
            .then(res => res.url);

        if (!fileUrl) return eventEmitter.emit("error", "Não foi possível encontrar o arquivo");

        const downloadResumable = FileSystem.createDownloadResumable(
            fileUrl,
            FileSystem.documentDirectory + "Manha de Luz.mp3",
            {},
            (downloadProgress) => {
                const progress =
                    downloadProgress.totalBytesWritten /
                    downloadProgress.totalBytesExpectedToWrite;

                eventEmitter.emit("progress", progress);
            }
        );

        try {
            const { uri } = await downloadResumable.downloadAsync();
            eventEmitter.emit("end", uri);
        } catch (err) {
            eventEmitter.emit("error", err);
        }
    }, 10);

    return eventEmitter;
}