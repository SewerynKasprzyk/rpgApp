import { Router, Request, Response } from "express";
import { CreateCharacterInput, createDefaultCharacter } from "@rpg/shared";
import * as characterService from "../services/characterService";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const characters = await characterService.getAllCharacters();
  res.json(characters);
});

router.get("/:id", async (req: Request, res: Response) => {
  const character = await characterService.getCharacterById(req.params.id);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(character);
});

router.post("/", async (req: Request, res: Response) => {
  const body: CreateCharacterInput = req.body;

  if (!body.name || !body.class) {
    res.status(400).json({ error: "name and class are required" });
    return;
  }

  const defaults = createDefaultCharacter();
  const character = await characterService.createCharacter({
    ...defaults,
    ...body,
    hp: body.hp ?? body.maxHp ?? 10,
    maxHp: body.maxHp ?? 10,
    inventory: body.inventory ?? [],
    campaignId: body.campaignId ?? "",
    ownerId: body.ownerId ?? "",
  } as CreateCharacterInput);

  res.status(201).json(character);
});

router.put("/:id", async (req: Request, res: Response) => {
  const updated = await characterService.updateCharacter(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await characterService.deleteCharacter(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
