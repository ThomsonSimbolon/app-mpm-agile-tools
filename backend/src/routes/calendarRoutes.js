/**
 * Calendar Routes
 * Routes for calendar events management
 */

const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Calendar Events
router.get("/events", calendarController.getEvents);
router.get("/events/today", calendarController.getTodayEvents);
router.get("/events/upcoming", calendarController.getUpcomingEvents);
router.get("/events/:id", calendarController.getEvent);
router.post("/events", calendarController.createEvent);
router.put("/events/:id", calendarController.updateEvent);
router.delete("/events/:id", calendarController.deleteEvent);
router.patch("/events/:id/cancel", calendarController.cancelEvent);

// Quick meeting creation
router.post("/meetings/quick", calendarController.createQuickMeeting);

module.exports = router;
