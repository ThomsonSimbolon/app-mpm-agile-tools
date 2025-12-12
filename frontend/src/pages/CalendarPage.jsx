/**
 * Calendar Page
 * Full calendar view with tasks, sprints, events, and milestones
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Calendar,
  Plus,
  Filter,
  ChevronDown,
  X,
  Clock,
  MapPin,
  Link as LinkIcon,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  ListTodo,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import * as calendarService from "../services/calendarService";
import { projectService } from "../services/projectService";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const calendarRef = useRef(null);

  // State
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");

  // Filters
  const [filters, setFilters] = useState({
    project_id: searchParams.get("project") || "",
    include_tasks: true,
    include_sprints: true,
    include_leaves: true,
    event_type: "",
  });

  // Event form
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "meeting",
    start_datetime: "",
    end_datetime: "",
    all_day: false,
    location: "",
    meeting_link: "",
    color: "#3B82F6",
    reminder_minutes: 30,
    project_id: "",
    attendees: [],
    is_private: false,
  });

  // Load initial data
  useEffect(() => {
    loadProjects();
  }, []);

  // Load events when filters change
  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data?.items || response.data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadEvents = async (start, end) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        start:
          start ||
          new Date(
            new Date().setMonth(new Date().getMonth() - 1)
          ).toISOString(),
        end:
          end ||
          new Date(
            new Date().setMonth(new Date().getMonth() + 2)
          ).toISOString(),
      };

      const response = await calendarService.getCalendarEvents(params);
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setEventForm((prev) => ({
      ...prev,
      start_datetime: `${info.dateStr}T09:00`,
      end_datetime: `${info.dateStr}T10:00`,
      all_day: false,
    }));
    setShowEventModal(true);
  };

  const handleEventClick = (info) => {
    const eventData = info.event.extendedProps;
    const eventId = info.event.id;

    // Handle different event types
    if (eventId.startsWith("task-")) {
      navigate(`/kanban?task=${eventData.taskId}`);
    } else if (eventId.startsWith("sprint-")) {
      navigate(`/sprints/${eventData.sprintId}`);
    } else if (eventId.startsWith("leave-")) {
      navigate("/leaves");
    } else {
      // Show event detail modal
      setShowEventDetail({
        id: eventId.replace("event-", ""),
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        allDay: info.event.allDay,
        ...eventData,
      });
    }
  };

  const handleEventDrop = async (info) => {
    const eventId = info.event.id;

    // Only allow dragging for events (not tasks/sprints)
    if (!eventId.startsWith("event-")) {
      info.revert();
      toast.error("Can only drag calendar events");
      return;
    }

    try {
      await calendarService.updateCalendarEvent(eventId.replace("event-", ""), {
        start_datetime: info.event.start.toISOString(),
        end_datetime:
          info.event.end?.toISOString() || info.event.start.toISOString(),
      });
      toast.success("Event updated");
    } catch (error) {
      info.revert();
      toast.error("Failed to update event");
    }
  };

  const handleEventResize = async (info) => {
    const eventId = info.event.id;

    if (!eventId.startsWith("event-")) {
      info.revert();
      return;
    }

    try {
      await calendarService.updateCalendarEvent(eventId.replace("event-", ""), {
        start_datetime: info.event.start.toISOString(),
        end_datetime: info.event.end.toISOString(),
      });
      toast.success("Event updated");
    } catch (error) {
      info.revert();
      toast.error("Failed to update event");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!eventForm.title || !eventForm.start_datetime) {
      toast.error("Title and start time are required");
      return;
    }

    try {
      await calendarService.createCalendarEvent({
        ...eventForm,
        project_id: eventForm.project_id || null,
      });
      toast.success("Event created successfully");
      setShowEventModal(false);
      resetEventForm();
      loadEvents();
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!showEventDetail?.id) return;

    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await calendarService.deleteCalendarEvent(showEventDetail.id);
      toast.success("Event deleted");
      setShowEventDetail(null);
      loadEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      event_type: "meeting",
      start_datetime: "",
      end_datetime: "",
      all_day: false,
      location: "",
      meeting_link: "",
      color: "#3B82F6",
      reminder_minutes: 30,
      project_id: "",
      attendees: [],
      is_private: false,
    });
    setSelectedDate(null);
  };

  const handleDatesSet = (info) => {
    loadEvents(info.start.toISOString(), info.end.toISOString());
  };

  const changeView = (view) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  const eventTypeColors = {
    meeting: "#3B82F6",
    reminder: "#F59E0B",
    deadline: "#EF4444",
    milestone: "#10B981",
    task: "#6B7280",
    sprint: "#8B5CF6",
    leave: "#F97316",
    other: "#6B7280",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-sm text-gray-500">
                View and manage your schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => changeView("dayGridMonth")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "dayGridMonth"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeView("timeGridWeek")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "timeGridWeek"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeView("listMonth")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "listMonth"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ListTodo className="w-4 h-4" />
              </button>
            </div>

            {/* Add Event Button */}
            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filters:</span>
          </div>

          {/* Project Filter */}
          <select
            value={filters.project_id}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, project_id: e.target.value }))
            }
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Toggle Buttons */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.include_tasks}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  include_tasks: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Tasks
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.include_sprints}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  include_sprints: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Sprints
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.include_leaves}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  include_leaves: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Leaves
          </label>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs text-gray-500">Legend:</span>
          <div className="flex items-center gap-3">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView={currentView}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              datesSet={handleDatesSet}
              height="auto"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: "short",
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              nowIndicator={true}
              eventDisplay="block"
            />
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create Event</h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetEventForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      event_type: e.target.value,
                      color: eventTypeColors[e.target.value] || "#3B82F6",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="reminder">Reminder</option>
                  <option value="deadline">Deadline</option>
                  <option value="milestone">Milestone</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_datetime}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        start_datetime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_datetime}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        end_datetime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* All Day */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.all_day}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      all_day: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">All day event</span>
              </label>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={eventForm.project_id}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      project_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Meeting room, address, etc."
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={eventForm.meeting_link}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      meeting_link: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event description..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={eventForm.color}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>

              {/* Private */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.is_private}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      is_private: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Private event</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    resetEventForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{showEventDetail.title}</h2>
              <button
                onClick={() => setShowEventDetail(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Time */}
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5" />
                <div>
                  {showEventDetail.allDay ? (
                    <span>All day</span>
                  ) : (
                    <>
                      {new Date(showEventDetail.start).toLocaleString()}
                      {showEventDetail.end && (
                        <> - {new Date(showEventDetail.end).toLocaleString()}</>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              {showEventDetail.location && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{showEventDetail.location}</span>
                </div>
              )}

              {/* Meeting Link */}
              {showEventDetail.meetingLink && (
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-5 h-5 text-gray-600" />
                  <a
                    href={showEventDetail.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              {/* Description */}
              {showEventDetail.description && (
                <div className="pt-2 border-t">
                  <p className="text-gray-600">{showEventDetail.description}</p>
                </div>
              )}

              {/* Project */}
              {showEventDetail.projectName && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Project:</span>
                  <span className="font-medium">
                    {showEventDetail.projectName}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    showEventDetail.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : showEventDetail.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {showEventDetail.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    showEventDetail.eventType === "meeting"
                      ? "bg-blue-100 text-blue-700"
                      : showEventDetail.eventType === "deadline"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {showEventDetail.eventType}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowEventDetail(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
