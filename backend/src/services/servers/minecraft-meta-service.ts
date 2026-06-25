import { injectable } from "tsyringe";

interface MojangVersion {
  id: string;
  type: "release" | "snapshot";
  url: string;
  time: string;
  releaseTime: string;
}

interface MojangManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MojangVersion[];
}

@injectable()
export class MinecraftMetaService {
  private versionCache: string[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

  public async getVersions(): Promise<string[]> {
    const now = Date.now();
    if (this.versionCache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.versionCache;
    }

    try {
      const response = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json");
      if (!response.ok) throw new Error("Failed to fetch Minecraft version manifest");

      const manifest = (await response.json()) as MojangManifest;

      // Filter out snapshots to keep the UI clean, or you can keep them if you want.
      // We will only return release versions to ensure stability.
      const releases = manifest.versions.filter(v => v.type === "release").map(v => v.id);

      this.versionCache = releases;
      this.cacheTimestamp = now;
      return releases;
    } catch (error) {
      console.error("Error fetching Minecraft versions:", error);
      // Fallback list of versions if external API is unreachable
      return ["1.21", "1.20.6", "1.20.4", "1.20.2", "1.20.1", "1.20", "1.19.4", "1.18.2", "1.17.1", "1.16.5"];
    }
  }

  public async getPaperBuilds(version: string): Promise<number[]> {
    try {
      const response = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}`);
      if (!response.ok) {
        return []; // No builds found or unsupported version
      }

      const data = (await response.json()) as { builds: number[] };
      // Return sorted descending (latest build first)
      return data.builds ? [...data.builds].reverse() : [];
    } catch (error) {
      console.error(`Error fetching Paper builds for version ${version}:`, error);
      return [];
    }
  }
}
