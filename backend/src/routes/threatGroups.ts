import { Router, Request, Response } from "express";
import { CreateThreatGroupInput } from "@rpg/shared";
import * as threatGroupService from "../services/threatGroupService";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const groups = await threatGroupService.getAllThreatGroups();
  res.json(groups);
});

router.get("/:id", async (req: Request, res: Response) => {
  const group = await threatGroupService.getThreatGroupById(req.params.id);
  if (!group) {
    res.status(404).json({ error: "ThreatGroup not found" });
    return;
  }
  res.json(group);
});

router.post("/", async (req: Request, res: Response) => {
  const body: CreateThreatGroupInput = req.body;
  if (!body.name && body.name !== "") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const group = await threatGroupService.createThreatGroup({
    name: body.name ?? "",
    threats: body.threats ?? [],
  });
  res.status(201).json(group);
});

router.put("/:id", async (req: Request, res: Response) => {
  const updated = await threatGroupService.updateThreatGroup(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "ThreatGroup not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await threatGroupService.deleteThreatGroup(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "ThreatGroup not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
