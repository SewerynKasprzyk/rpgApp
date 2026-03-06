import { Router, Request, Response } from "express";
import { CreateCampaignInput } from "@rpg/shared";
import * as campaignService from "../services/campaignService";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const campaigns = await campaignService.getAllCampaigns();
  res.json(campaigns);
});

router.post("/", async (req: Request, res: Response) => {
  const body: CreateCampaignInput = req.body;

  if (!body.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const campaign = await campaignService.createCampaign({
    name: body.name,
    description: body.description ?? "",
    playerIds: body.playerIds ?? [],
  });

  res.status(201).json(campaign);
});

export default router;
