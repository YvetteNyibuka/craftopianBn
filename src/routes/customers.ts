import { Router } from "express";
import {
    getCustomers, getCustomer, createCustomer,
    updateCustomer, deleteCustomer, getCustomerStats,
} from "../controllers/customerController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/stats", getCustomerStats);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", restrictTo("admin", "staff"), createCustomer);
router.patch("/:id", restrictTo("admin", "staff"), updateCustomer);
router.delete("/:id", restrictTo("admin"), deleteCustomer);

export default router;
