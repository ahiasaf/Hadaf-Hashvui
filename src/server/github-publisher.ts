import { authorized } from "./database.ts";
type Payload = Record<string, string>;
type Configuration = {
  token: string;
  repository: string;
  branch: string;
  readKey: string;
};
export function createPublisher(
  config: Configuration,
  request: typeof fetch = fetch,
) {
  async function publish(payload: Payload) {
    if (!authorized(payload.key, config.readKey))
      throw new Error("Access denied");
    if (
      !config.token ||
      !/^[\w.-]+\/[\w.-]+$/.test(config.repository) ||
      !config.branch
    )
      throw new Error("GitHub publishing configuration missing");
    if (!["ghput", "ghdel"].includes(payload.action))
      throw new Error("Invalid publishing action");
    const path = payload.path?.replace(/^\/+/, "") || "";
    if (
      !/^(slides|audio)\/[^/]+\/[^/]+$/.test(path) ||
      path.includes("..") ||
      [...path].some(
        (character) =>
          character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      ) ||
      path.includes("\\")
    )
      throw new Error("Invalid publishing path");
    if (
      payload.action === "ghput" &&
      (!payload.b64 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          payload.b64,
        ))
    )
      throw new Error("Invalid publishing content");
    const url =
      "https://api.github.com/repos/" +
      config.repository +
      "/contents/" +
      path.split("/").map(encodeURIComponent).join("/");
    const headers = {
      Authorization: "Bearer " + config.token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const previous = await request(
      url + "?ref=" + encodeURIComponent(config.branch),
      { headers, signal: AbortSignal.timeout(10000) },
    );
    let sha = "";
    if (previous.status === 200) {
      const value: unknown = await previous.json();
      if (
        !value ||
        typeof value !== "object" ||
        !("sha" in value) ||
        typeof value.sha !== "string" ||
        !("type" in value) ||
        value.type !== "file"
      )
        throw new Error("GitHub content response invalid");
      sha = value.sha;
    } else if (previous.status !== 404)
      throw new Error("GitHub content lookup failed");
    if (payload.action === "ghdel" && !sha)
      return { status: "ok", path, gone: true };
    // Use the exact observed SHA. Conflicts require review rather than overwriting a concurrent upload.
    const body = {
      message:
        (payload.action === "ghput"
          ? sha
            ? "chore: replace "
            : "chore: upload "
          : "chore: remove ") + path,
      branch: config.branch,
      ...(sha ? { sha } : {}),
      ...(payload.action === "ghput" ? { content: payload.b64 } : {}),
    };
    const response = await request(url, {
      method: payload.action === "ghput" ? "PUT" : "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(18000),
    });
    if (![200, 201].includes(response.status))
      throw new Error(
        response.status === 409
          ? "GitHub content changed; reload before publishing"
          : "GitHub publishing was not acknowledged",
      );
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("commit" in result) ||
      !result.commit ||
      typeof result.commit !== "object" ||
      !("sha" in result.commit) ||
      typeof result.commit.sha !== "string"
    )
      throw new Error("GitHub commit was not acknowledged");
    return {
      status: "ok",
      path,
      commit: result.commit.sha,
      ...(payload.action === "ghput" ? { replaced: !!sha } : {}),
    };
  }
  return publish;
}
export function publishRepositoryFile(payload: Payload) {
  return createPublisher({
    token: process.env.GH_TOKEN || "",
    repository: process.env.GH_REPO || "ahiasaf/Hadaf-Hashvui",
    branch: process.env.GH_BRANCH || "",
    readKey: process.env.READ_KEY || "",
  })(payload);
}
