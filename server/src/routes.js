import { Router } from "express";
import authRoutes from "./modules/auth/routes.js";
import brandsRoutes from "./modules/brands/routes.js";
import catalogRoutes from "./modules/catalog/routes.js";
import dashboardRoutes from "./modules/dashboard/routes.js";
import inventoryRoutes from "./modules/inventory/routes.js";
import legalRoutes from "./modules/legal/routes.js";
import {
  productionOrdersRouter,
  recipesRouter,
} from "./modules/production/routes.js";
import purchasingRoutes from "./modules/purchasing/routes.js";
import salesRoutes from "./modules/sales/routes.js";
import storesRoutes from "./modules/stores/routes.js";
import suppliersRoutes from "./modules/suppliers/routes.js";
import usersRoutes from "./modules/users/routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/stores", storesRoutes);
router.use("/products", catalogRoutes);
router.use("/brands", brandsRoutes);
router.use("/suppliers", suppliersRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchases", purchasingRoutes);
router.use("/recipes", recipesRouter);
router.use("/production-orders", productionOrdersRouter);
router.use("/sales-orders", salesRoutes);
router.use("/users", usersRoutes);
router.use("/legal", legalRoutes);

export default router;
