import { PrismaClient } from '@prisma/client';
import { Context } from 'elysia';
import { JwtPayload } from '../middleware/auth.middleware.ts';

interface EventContext extends Context {
  db: PrismaClient;
  store: {
    user: JwtPayload;
  };
  params: {
    id: string;
  };
}

export const rsvpHandler = async ({ db, store, params, set, server }: EventContext) => {
  const { id: eventId } = params;
  const userId = store.user.id;

  try {
    // Check if event exists and is approved
    const event = await db.event.findUnique({
      where: { id: eventId, approved: true },
    });

    if (!event) {
      set.status = 404;
      return { error: 'Event not found or not approved.' };
    }

    // Check if user already RSVP'd
    const existingRsvp = await db.rsvp.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingRsvp) {
      set.status = 400;
      return { error: 'You have already RSVP\'d to this event.' };
    }

    const rsvp = await db.rsvp.create({
      data: {
        userId,
        eventId,
      },
      include: {
        user: { select: { email: true } },
        event: true,
      },
    });

    // 🚀 REALTIME UPDATE - Use server.publish instead of app.publish
    server.publish('events', { type: 'NEW_RSVP', payload: rsvp });

    set.status = 201;
    return { message: 'RSVP successful', rsvp };
  } catch (error) {
    console.error(error);
    set.status = 500;
    return { error: 'Could not process RSVP.' };
  }
};