import { injectable } from "tsyringe";
import { docker } from "@/lib/docker";
import * as path from "path";
import os from "os";

@injectable()
export class SystemUpdateService {
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
    const hostProjectDir = await this.getHostProjectDir();

    // Ensure alpine/git image is available
    await new Promise<void>((resolve, reject) => {
      docker.pull("alpine/git:latest", {}, (err, stream) => {
        if (err) return reject(err);
        if (!stream) return reject(new Error("No stream returned from docker pull"));
        docker.modem.followProgress(stream, (followErr) => {
          if (followErr) reject(followErr);
          else resolve();
        });
      });
    });

    // Create transient container to check git hashes and version.json
    const containerName = `wamc-update-check-${Date.now()}`;
    const container = await docker.createContainer({
      Image: "alpine/git:latest",
      name: containerName,
      Cmd: [
        "sh",
        "-c",
        `git fetch origin main && \
         echo LOCAL_HASH=$(git rev-parse HEAD) && \
         echo REMOTE_HASH=$(git rev-parse origin/main) && \
         (if [ -f version.json ]; then echo LOCAL_VER=$(grep -o '"version": "[^"]*' version.json | cut -d'"' -f4); else echo LOCAL_VER=1.0.0; fi) && \
         (if git show origin/main:version.json > /dev/null 2>&1; then echo REMOTE_VER=$(git show origin/main:version.json | grep -o '"version": "[^"]*' | cut -d'"' -f4); else echo REMOTE_VER=1.0.0; fi)`,
      ],
      HostConfig: {
        Binds: [`${hostProjectDir}:/workspace`],
      },
      WorkingDir: "/workspace",
    });

    try {
      await container.start();
      await container.wait();

      // Get container stdout/stderr
      const logsBuffer = await container.logs({ stdout: true, stderr: true });
      const logs = logsBuffer.toString("utf8");

      const localMatch = logs.match(/LOCAL_HASH=([a-f0-9]+)/);
      const remoteMatch = logs.match(/REMOTE_HASH=([a-f0-9]+)/);
      const localVerMatch = logs.match(/LOCAL_VER=([^\s\r\n]+)/);
      const remoteVerMatch = logs.match(/REMOTE_VER=([^\s\r\n]+)/);

      const localHash = localMatch ? localMatch[1] : "unknown";
      const remoteHash = remoteMatch ? remoteMatch[1] : "unknown";
      const localVer = localVerMatch ? localVerMatch[1] : "1.0.0";
      const remoteVer = remoteVerMatch ? remoteVerMatch[1] : "1.0.0";

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

      const updateAvailable =
        isVersionGreater(remoteVer, localVer) ||
        (localVer === remoteVer && localHash !== remoteHash && localHash !== "unknown" && remoteHash !== "unknown");

      return {
        updateAvailable,
        currentVersion: localVer,
        latestVersion: remoteVer,
        currentCommit: localHash.slice(0, 7),
        latestCommit: remoteHash.slice(0, 7),
        fullCurrentCommit: localHash,
        fullLatestCommit: remoteHash,
      };
    } finally {
      // Clean up the container
      await container.remove({ force: true }).catch(() => {});
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

    // Stop and remove old updater if it exists
    try {
      const oldContainer = docker.getContainer(containerName);
      await oldContainer.remove({ force: true }).catch(() => {});
    } catch {}

    // Create detached container to run the update commands in the background
    const container = await docker.createContainer({
      Image: "alpine:latest",
      name: containerName,
      Cmd: [
        "sh",
        "-c",
        "apk add --no-cache git docker-cli docker-cli-compose && git pull origin main && docker compose up -d --build",
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
