const request = require("request");

function isoToUnixTime(isoString) {
    // ISO 8601形式の日時文字列をDateオブジェクトに変換
    const date = new Date(isoString);
    // UNIXタイムスタンプをミリ秒単位で取得し、秒単位に変換
    const unixTime = Math.floor(date.getTime() / 1000);
    return unixTime;
}

class MeboApi {
    constructor(key, botid, version, botname) {
        this.key = key
        this.botid = botid
        this.version = version
        this.botname = botname

        
        this.idToken = ""
        this.refreshToken = ""
        this.expiresIn = ""
        this.localId = ""
        this.lastRefreshAt = ""
    }

    async initChat() {
        await this._signupNewUser()
        await this._getAccountInfo()
        await this._getBotStatus()
        await this._chat("")
    }

    async chat(msg, base64Image = "") {
        if (this.idToken === "") {
            await this.initChat()
        }

        if (this.lastRefreshAt + 1800 < Math.floor(Date.now() / 1000)){

            await this.initChat()
        }
        
        if (this.lastRefreshAt + 480 < Math.floor(Date.now() / 1000)){
            await this._refreshToken()
        }

        if (this.isCheckExpire()) {
            await this._refreshToken()
        }
        return await this._chat(msg, base64Image)
    }

    async _signupNewUser() {
        const options = {
            url: `https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=${this.key}`,
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Accept": "*/*",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
                "Content-Type": "application/json",
                "X-Client-Version": "Firefox/JsCore/8.10.1/FirebaseCore-web",
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            referrer: "https://mabo.work/",
            body: JSON.stringify({ "returnSecureToken": true }),
            mode: "cors"
        };


        await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }).then(data => {
            console.dir(data, { depth: null });
            this.idToken = data.idToken
            this.refreshToken = data.refreshToken
            this.expiresIn = data.expiresIn
            this.localId = data.localId
            
        })
            .catch(error => {
                console.error("Error:", error);
            });
    }

    async _getAccountInfo() {
        const options = {
            url: `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${this.key}`,
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Accept": "*/*",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
                "Content-Type": "application/json",
                "X-Client-Version": "Firefox/JsCore/8.10.1/FirebaseCore-web",
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            referrer: "https://mabo.work/",
            body: JSON.stringify({ "idToken": this.idToken }),
            mode: "cors"
        };


        await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }).then(data => {
            console.dir(data, { depth: null });
            this.lastRefreshAt = isoToUnixTime(data.users[0].lastRefreshAt)
        })
            .catch(error => {
                console.error("Error:", error);
            });
    }

    async _getBotStatus() {
        const options = {
            url: `https://api-mebo.dev/bot/${this.botid}`,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Accept": "*/*",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
                "Content-Type": "application/json",
                "X-Auth-Token": this.idToken,
                "Sec-GPC": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Priority": "u=4",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            referrer: "https://mabo.work/",
            mode: "cors"
        };


        await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }).then(data => {
            console.dir(data, { depth: null });
        })
            .catch(error => {
                console.error("Error:", error);
            });
    
    }

    async _chat(msg, base64Image = "") {
        const options = {
            url: "https://api-mebo.dev/chat",
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Accept": "*/*",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
                "X-Auth-Token": this.idToken,
                "Content-Type": "application/json",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Priority": "u=1",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            referrer: "https://mabo.work/",
            body: JSON.stringify({
                utterance: msg,
                botid: this.botid,
                version: this.version,
                uid: this.localId,
                state: {
                    name: this.botname,
                    id: this.botid
                },
                base64Image: base64Image,
                useStreaming: false
            }),
            mode: "cors"
        };

        return await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                    console.dir(JSON.parse(body), { depth: null });
                }
            });
        });
    }

    async _refreshToken() {
        const options = {
            url: `https://securetoken.googleapis.com/v1/token?key=${this.key}`,
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                "Accept": "*/*",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Client-Version": "Firefox/JsCore/8.10.1/FirebaseCore-web",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Priority": "u=1"
            },
            referrer: "https://mabo.work/",
            body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
            mode: "cors"
        };


        await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }).then(data => {
            console.dir(data, { depth: null });
            this.idToken = data.id_token
            this.refreshToken = data.refresh_token
            this.expiresIn = data.expires_in
            this.localId = data.user_id
        })
            .catch(error => {
                console.error("Error:", error);
            });
    }


    isCheckExpire(now = Math.floor(Date.now() / 1000)){
        const expire = this.lastRefreshAt + this.expiresIn;
        if (now > expire) {
            return true;
        } else {
            return false;
        }
    }
}


module.exports = { MeboApi }