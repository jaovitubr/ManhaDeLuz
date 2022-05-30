import config from "../../app.json";

const headers = {
    "User-Agent": config.soundcloud_fetch_user_agent,
    Accept: "*/*",
}

async function GetBody(url) {
    const promise = fetch(url, { headers }).then((resp) => { return resp.text() });

    promise.then(body => {
        console.log("GetBody() Response:", url, body.length);
    });

    promise.catch(error => {
        console.log("GetBody() Error:", error.error || error);
    });

    return promise;
}

function GetResourcesUrlFromBody(body) {
    try {
        const regex = new RegExp(config.scrapper_resources_regex, "g");

        return String(body).match(regex).map(match => match.replace("src=", "").trim().replace(/\"/g, ""));
    } catch { }
}

function GetClientIDFromBody(body) {
    try {
        const regex = new RegExp(config.scrapper_client_id_regex, "g");

        return String(body).match(regex).map(match => match.replace("client_id:", "").trim().replace(/\"/g, ""));
    } catch { }
}

export async function CheckClientID(client_id) {
    return new Promise((resolve) => {
        try {
            return fetch(`https://api-v2.soundcloud.com/announcements?client_id=${client_id}`)
                .then((resp) => { return resp.json() })
                .then(json => resolve(true))
                .catch(error => resolve(false));
        } catch {
            resolve(false);
        }
    });
}

export default async () => {
    const body = await GetBody(config.soundcloud_url);
    const resources_urls = GetResourcesUrlFromBody(body);

    for (const url of resources_urls) {
        const resource_body = await GetBody(url);
        const client_ids = GetClientIDFromBody(resource_body);

        console.log(client_ids);

        for (const client_id of client_ids || []) {
            if (await CheckClientID(client_id)) return client_id;
        }
    }
}