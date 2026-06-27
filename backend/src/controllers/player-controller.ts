import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { PlayerService } from "@/services/servers/player-service";

@injectable()
export class PlayerController extends BaseController {
  constructor(@inject(PlayerService) private readonly playerService: PlayerService) {
    super();
  }

  @AsyncController()
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };

    const players = await this.playerService.listOnlinePlayers(id, userId);
    return this.ok(res, players, "Online players listed successfully");
  }

  @AsyncController()
  async kick(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { player } = req.body;

    await this.playerService.kickPlayer(id, userId, player);
    return this.ok(res, undefined, `Player "${player}" has been kicked`);
  }

  @AsyncController()
  async toggleOp(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { id } = req.params as { id: string };
    const { player, op } = req.body;

    await this.playerService.toggleOp(id, userId, player, op);
    return this.ok(res, undefined, `Player "${player}" operator status updated`);
  }
}
