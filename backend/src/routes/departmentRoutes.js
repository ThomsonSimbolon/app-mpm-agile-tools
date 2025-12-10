const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All routes require authentication
router.use(auth);

// Department CRUD
router.post("/", roleCheck(["admin"]), departmentController.create);
router.get("/", departmentController.list);
router.get("/:id", departmentController.getById);
router.put("/:id", roleCheck(["admin"]), departmentController.update);
router.delete("/:id", roleCheck(["admin"]), departmentController.delete);

// Additional endpoints
router.get("/:id/stats", departmentController.getStats);
router.put("/reorder", roleCheck(["admin"]), departmentController.reorder);

module.exports = router;
