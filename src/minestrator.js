const BASE_URL = "https://mine.sttr.io";

class MinestratorError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MinestratorError";
    this.status = status;
  }
}

class MinestratorClient {
  constructor(apiKey) {
    const encoded = Buffer.from(apiKey).toString("base64");
    this.headers = {
      Authorization: `Bearer ${encoded}`,
      "Content-Type": "application/json",
    };
  }

  async request(method, path, body) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error?.message ?? JSON.stringify(data);
      throw new MinestratorError(message, response.status);
    }

    return data;
  }

  async getUser() {
    const data = await this.request("GET", "/user");
    return data.api.data.user.datas;
  }

  async listServers(userId) {
    const data = await this.request("GET", `/user/${userId}/servers`);
    return data.api.data.servers;
  }

  async getServer(serverId) {
    const data = await this.request("GET", `/server/${serverId}`);
    return data.api.data.server;
  }

  async startServer(serverId) {
    await this.request("PUT", `/server/${serverId}/poweraction`, {
      poweraction: "start",
    });
  }
}

module.exports = { MinestratorClient, MinestratorError };
