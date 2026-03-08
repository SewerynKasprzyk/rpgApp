import { Router } from "express";
import {
  getAllLocationGroups,
  getLocationGroupById,
  createLocationGroup,
  updateLocationGroup,
  deleteLocationGroup,
} from "../services/locationGroupService";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const groups = await getAllLocationGroups();
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await getLocationGroupById(req.params.id);
    if (!group) return res.status(404).json({ error: "Location group not found" });
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const group = await createLocationGroup(req.body);
    res.status(201).json(group);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const group = await updateLocationGroup(req.params.id, req.body);
    if (!group) return res.status(404).json({ error: "Location group not found" });
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteLocationGroup(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Location group not found" });
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
