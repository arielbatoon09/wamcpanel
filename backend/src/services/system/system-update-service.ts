import { injectable } from "tsyringe";
import { docker } from "@/lib/docker";
import * as path from "path";
import fs from "fs";
import os from "os";

@injectable()
export class SystemUpdateService {
  private static readonly sessionId = Math.random().toString(36).substring(2, 15);

  public async getLocalChangelog() {
    const paths = [
      path.resolve(process.cwd(), "changelogs.json"), // Docker
      path.resolve(process.cwd(), "../changelogs.json"), // Dev
    ];
    for (const p of paths) {
      try {
        const content = await fs.promises.readFile(p, "utf8");
        return JSON.parse(content);
      } catch {
        // Ignore error if file reading fails
      }
    }
    return {};
  }

  public async getLocalVersion(): Promise<string> {
    const paths = [
      path.resolve(process.cwd(), "version.json"), // Docker
      path.resolve(process.cwd(), "../version.json"), // Dev
    ];
    for (const p of paths) {
      try {
        const content = await fs.promises.readFile(p, "utf8");
        const parsed = JSON.parse(content);
        if (parsed && parsed.version) {
          return parsed.version;
        }
      } catch {
        // Ignore error if file reading or parsing fails
      }
    }
    return "1.0.0";
  }

  private async getHostProjectDir(): Promise<string> {
    // Detect host directory by inspecting ourselves via Docker socket
    try {
      const selfContainer = docker.getContainer(os.hostname());
      const inspectData = await selfContainer.inspect();
      const serversMount = inspectData.Mounts?.find(
        (m: any) => m.Destination === "/servers"
      );
      if (serversMount && serversMount.Source) {
        // The host path of /servers is e.g. /opt/wamcpanel/servers
        // The project root is the parent directory, /opt/wamcpanel
        return path.dirname(serversMount.Source);
      }
    } catch {
      // Fallback if not running in Docker or unable to inspect self
    }

    // Default fallback to /opt/wamcpanel if not detected
    return "/opt/wamcpanel";
  }

  public async checkUpdate() {
    const localVer = await this.getLocalVersion();

    try {
      // Fetch remote version from GitHub
      const versionRes = await fetch("https://raw.githubusercontent.com/arielbatoon09/wamcpanel/master/version.json");
      if (!versionRes.ok) {
        throw new Error(`Failed to fetch remote version: ${versionRes.statusText}`);
      }
      const remoteData = (await versionRes.json()) as { version: string };
      const remoteVer = remoteData.version;

      // Fetch remote changelogs from GitHub
      const changelogsRes = await fetch("https://raw.githubusercontent.com/arielbatoon09/wamcpanel/master/changelogs.json");
      let changelogs: any = {};
      if (changelogsRes.ok) {
        try {
          changelogs = await changelogsRes.json();
        } catch {
          // Ignore JSON parsing errors for remote changelogs
        }
      }

      const isVersionGreater = (v1: string, v2: string): boolean => {
        const parts1 = v1.split(".").map(Number);
        const parts2 = v2.split(".").map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const p1 = parts1[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 > p2) return true;
          if (p1 < p2) return false;
        }
        return false;
      };

      const updateAvailable = isVersionGreater(remoteVer, localVer);

      return {
        updateAvailable,
        currentVersion: localVer,
        latestVersion: remoteVer,
        currentCommit: "local",
        latestCommit: "remote",
        fullCurrentCommit: "local",
        fullLatestCommit: "remote",
        changelogs,
        systemSessionId: SystemUpdateService.sessionId,
      };
    } catch (e: any) {
      console.error("Failed to check updates via GitHub raw feed:", e);
      return {
        updateAvailable: false,
        currentVersion: localVer,
        latestVersion: localVer,
        currentCommit: "local",
        latestCommit: "local",
        fullCurrentCommit: "local",
        fullLatestCommit: "local",
        changelogs: {},
        systemSessionId: SystemUpdateService.sessionId,
      };
    }
  }

  public async triggerUpdate() {
    const hostProjectDir = await this.getHostProjectDir();

    // Ensure alpine image is available
    await new Promise<void>((resolve, reject) => {
      docker.pull("alpine:latest", {}, (err, stream) => {
        if (err) return reject(err);
        if (!stream) return reject(new Error("No stream returned from docker pull"));
        docker.modem.followProgress(stream, (followErr) => {
          if (followErr) reject(followErr);
          else resolve();
        });
      });
    });

    const containerName = "wamcpanel-updater";

    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.remove({ force: true }).catch(() => { });
    } catch {
      // Ignore error if the container does not exist
    }

    // Create detached container to run the update commands in the background
    const container = await docker.createContainer({
      Image: "alpine:latest",
      name: containerName,
      Cmd: [
        "sh",
        "-c",
        "apk add --no-cache git docker-cli docker-cli-compose && git config --global --add safe.directory /workspace && git checkout . && git pull && docker compose up -d --build --force-recreate",
      ],
      HostConfig: {
        Binds: [
          "/var/run/docker.sock:/var/run/docker.sock",
          `${hostProjectDir}:/workspace`,
        ],
      },
      WorkingDir: "/workspace",
    });

    // Start container and detach (do not wait for it to complete)
    await container.start();

    return {
      success: true,
      message: "Update initiated. The panel will pull changes, rebuild, and restart shortly.",
    };
  }
}
