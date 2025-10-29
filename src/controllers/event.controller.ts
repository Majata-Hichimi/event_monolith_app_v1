// src/controllers/event.controller.ts

import { PrismaClient } from '@prisma/client';
import { Context } from 'elysia';
import { JwtPayload } from '../middleware/auth.middleware.ts';

// Context extended by auth middleware
interface EventContext extends Context {
  db: PrismaClient;
  store: {
    user: JwtPayload; // 'user' is guaranteed to be here by isAuthenticated
  };
  params: {
    id: string; // For routes like /events/:id
  };
}

export const createEventHandler = async ({ db, store, body, set, server }: EventContext) => {
  const { title, description, date, location } = body as Record<string, any>;
  const userId = store.user.id;

  try {
    const newEvent = await db.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        organizerId: userId,
        approved: false, // Events need admin approval
      },
    });

    // 🚀 REALTIME UPDATE - Use server.publish instead of app.publish
    server.publish('events', { type: 'NEW_EVENT', payload: newEvent });

    set.status = 201;
    return newEvent;
  } catch (error) {
    set.status = 500;
    return { error: 'Could not create event.' };
  }
};

// ✅ UPDATED: Now respects user role
export const getAllEventsHandler = async ({ db, store, set }: EventContext) => {
  const user = store.user; // Authenticated user is guaranteed

  // Build dynamic filter based on role
  const whereCondition: { approved?: boolean } = {};
  if (user.role !== 'ADMIN') {
    whereCondition.approved = true;
  }
  // If user.role === 'ADMIN', whereCondition remains {}, fetching all events

  try {
    const events = await db.event.findMany({
      where: whereCondition,
      include: {
        organizer: {
          select: { email: true, id: true },
        },
        rsvps: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    set.status = 500;
    return { error: 'Could not fetch events.' };
  }
};

export const updateEventHandler = async ({ db, store, params, body, set, server }: EventContext) => {
  const { id } = params;
  const { title, description, date, location } = body as Record<string, any>;
  const user = store.user;

  try {
    const event = await db.event.findUnique({ where: { id } });

    if (!event) {
      set.status = 404;
      return { error: 'Event not found.' };
    }

    // Only organizer or admin can update
    if (event.organizerId !== user.id && user.role !== 'ADMIN') {
      set.status = 403;
      return { error: 'You are not authorized to update this event.' };
    }

    const updatedEvent = await db.event.update({
      where: { id },
      data: { title, description, date: date ? new Date(date) : undefined, location },
    });

    // 🚀 REALTIME UPDATE - Use server.publish instead of app.publish
    server.publish('events', { type: 'UPDATE_EVENT', payload: updatedEvent });

    return updatedEvent;
  } catch (error) {
    set.status = 500;
    return { error: 'Could not update event.' };
  }
};

export const deleteEventHandler = async ({ db, store, params, set, server }: EventContext) => {
  const { id } = params;
  const user = store.user;

  try {
    const event = await db.event.findUnique({ where: { id } });

    if (!event) {
      set.status = 404;
      return { error: 'Event not found.' };
    }

    // Only organizer or admin can delete
    if (event.organizerId !== user.id && user.role !== 'ADMIN') {
      set.status = 403;
      return { error: 'You are not authorized to delete this event.' };
    }

    // Must delete related RSVPs first due to foreign key constraint
    await db.rsvp.deleteMany({
      where: { eventId: id },
    });
    
    await db.event.delete({ where: { id } });

    // 🚀 REALTIME UPDATE - Use server.publish instead of app.publish
    server.publish('events', { type: 'DELETE_EVENT', payload: { id } });

    set.status = 204; // No Content
  } catch (error) {
    console.error(error);
    set.status = 500;
    return { error: 'Could not delete event.' };
  }
};

export const approveEventHandler = async ({ db, params, set, server }: EventContext) => {
  const { id } = params;

  try {
    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      set.status = 404;
      return { error: 'Event not found.' };
    }

    const approvedEvent = await db.event.update({
      where: { id },
      data: { approved: true },
    });

    // 🚀 REALTIME UPDATE - Use server.publish instead of app.publish
    server.publish('events', { type: 'APPROVE_EVENT', payload: approvedEvent });

    return { message: 'Event approved', event: approvedEvent };
  } catch (error) {
    set.status = 500;
    return { error: 'Could not approve event.' };
  }
};