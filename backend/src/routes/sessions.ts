import { Router, Request, Response } from "express";
import { CreateSessionInput } from "@rpg/shared";
import * as sessionService from "../services/sessionService";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const sessions = await sessionService.getAllSessions();
  res.json(sessions);
});

router.get("/:id", async (req: Request, res: Response) => {
  const session = await sessionService.getSessionById(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.post("/", async (req: Request, res: Response) => {
  const body: Partial<CreateSessionInput> = req.body;

  if (!body.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const session = await sessionService.createSession({
    name: body.name,
    description: body.description ?? "",
    characters: body.characters ?? [],
    enemies: body.enemies ?? [],
    neutrals: body.neutrals ?? [],
    diceHistory: body.diceHistory ?? [],
    scenes: body.scenes ?? [],
    gmElements: body.gmElements ?? [],
  });

  res.status(201).json(session);
});

router.put("/:id", async (req: Request, res: Response) => {
  const updated = await sessionService.updateSession(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await sessionService.deleteSession(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
