import Elysia from 'elysia';
import {
  createEventHandler,
  getAllEventsHandler,
  updateEventHandler,
  deleteEventHandler,
  approveEventHandler,
} from '../controllers/event.controller.ts';
import { rsvpHandler } from '../controllers/rsvp.controller.ts';
import { isAuthenticated, isAdmin, isOrganizer } from '../middleware/auth.middleware.ts';

// We pass the main 'app' instance to the event handlers for websocket publishing
export const eventRoutes = (app: Elysia) =>
  app.group('/events', (app) =>
    app
      // Apply isAuthenticated middleware to all routes in this group
      .onBeforeHandle(isAuthenticated)

      // --- Event Routes ---

      // GET /events - Get all approved events
      .get('/', getAllEventsHandler, {
        detail: {
          summary: 'Get All Approved Events',
          tags: ['Events'],
        },
      })

      // POST /events - Create a new event (Organizers only)
      .post('/', createEventHandler, {
        beforeHandle: isOrganizer, // Role check
        detail: {
          summary: 'Create Event',
          tags: ['Events'],
        },
      })

      // PUT /events/:id - Update an event (Organizer or Admin)
      .put('/:id', updateEventHandler, {
        // Role check is handled inside the controller for complex logic
        detail: {
          summary: 'Update Event',
          tags: ['Events'],
        },
      })

      // DELETE /events/:id - Delete an event (Organizer or Admin)
      .delete('/:id', deleteEventHandler, {
        // Role check is handled inside the controller
        detail: {
          summary: 'Delete Event',
          tags: ['Events'],
        },
      })

      // --- Admin Route ---

      // PUT /events/:id/approve - Approve an event (Admin only)
      .put('/:id/approve', approveEventHandler, {
        beforeHandle: isAdmin, // Role check
        detail: {
          summary: 'Approve Event (Admin)',
          tags: ['Events', 'Admin'],
        },
      })

      // --- RSVP Route ---

      // POST /events/:id/rsvp - RSVP to an event (Attendees only)
      .post('/:id/rsvp', rsvpHandler, {
        // Role check handled in controller
        detail: {
          summary: 'RSVP to Event',
          tags: ['RSVP'],
        },
      })
  );