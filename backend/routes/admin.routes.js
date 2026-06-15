import { Router } from "express";
import { dashboard, activity, branches, createBranch, branchDashboard, branchVerify, warehouses, warehouseDetail, warehouseStaff, createWarehouse, deleteUser } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireBranchAuth } from "../middleware/admin.middleware.js";

const router = Router();

router.get("/dashboard", requireAuth, dashboard);
router.get("/activity", requireAuth, activity);
router.delete("/users/:id", requireAuth, deleteUser);
router.get("/branches", requireAuth, branches);
router.post("/branches", requireAuth, createBranch);
router.get("/warehouses", requireAuth, warehouses);
router.get("/warehouses/:id", requireAuth, warehouseDetail);
router.post("/warehouses/staff", requireAuth, warehouseStaff);
router.post("/warehouses", requireAuth, createWarehouse);

router.get("/branch/shipments", requireAuth, requireBranchAuth, branchDashboard);
router.post("/branch/verify", requireAuth, requireBranchAuth, branchVerify);

export default router;
