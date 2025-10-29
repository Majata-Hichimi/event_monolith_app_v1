import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Middleware to verify JWT
const verifyAuth = async ({ jwt, headers, set }: any) => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  const payload = await jwt.verify(token);

  if (!payload) {
    set.status = 401;
    throw new Error("Invalid token");
  }

  return payload;
};

export const eventRoutes = new Elysia({ prefix: "" })
  // Get all events
  .get("/events", async ({ jwt, headers, set }) => {
    try {
      const user = await verifyAuth({ jwt, headers, set });

      const events = await db.event.findMany({
        include: {
          rsvps: true,
          organizer: {
            select: { id: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return events;
    } catch (error: any) {
      set.status =
        error.message === "Unauthorized" || error.message === "Invalid token"
          ? 401
          : 500;
      return { error: error.message || "Failed to fetch events" };
    }
  })
  // Create event
  .post(
    "/events",
    async ({ body, jwt, headers, set }) => {
      try {
        const user = await verifyAuth({ jwt, headers, set });

        if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Only organizers can create events" };
        }

        const event = await db.event.create({
          data: {
            title: body.title,
            description: body.description,
            date: new Date(body.date),
            location: body.location,
            organizerId: user.id,
            approved: user.role === "ADMIN",
          },
        });

        return event;
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Failed to create event" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.String(),
        date: t.String(),
        location: t.String(),
      }),
    }
  )
  // Approve event (Admin only)
  .put("/events/:id/approve", async ({ params, jwt, headers, set }) => {
    try {
      const user = await verifyAuth({ jwt, headers, set });

      if (user.role !== "ADMIN") {
        set.status = 403;
        return { error: "Only admins can approve events" };
      }

      const event = await db.event.update({
        where: { id: params.id },
        data: { approved: true },
      });

      return event;
    } catch (error: any) {
      set.status = 500;
      return { error: error.message || "Failed to approve event" };
    }
  })
  // Delete event
  .delete("/events/:id", async ({ params, jwt, headers, set }) => {
    try {
      const user = await verifyAuth({ jwt, headers, set });

      const event = await db.event.findUnique({
        where: { id: params.id },
      });

      if (!event) {
        set.status = 404;
        return { error: "Event not found" };
      }

      if (user.role !== "ADMIN" && event.organizerId !== user.id) {
        set.status = 403;
        return { error: "You don't have permission to delete this event" };
      }

      await db.event.delete({ where: { id: params.id } });

      return { message: "Event deleted successfully" };
    } catch (error: any) {
      set.status = 500;
      return { error: error.message || "Failed to delete event" };
    }
  })
  // RSVP to event
  .post(
    "/events/:id/rsvp",
    async ({ params, body, jwt, headers, set }) => {
      try {
        const user = await verifyAuth({ jwt, headers, set });

        if (user.role !== "ATTENDEE") {
          set.status = 403;
          return { error: "Only attendees can RSVP" };
        }

        // Check if already RSVP'd
        const existingRSVP = await db.rSVP.findUnique({
          where: {
            userId_eventId: {
              userId: user.id,
              eventId: params.id,
            },
          },
        });

        let rsvp;
        if (existingRSVP) {
          // Update existing RSVP
          rsvp = await db.rSVP.update({
            where: { id: existingRSVP.id },
            data: { status: body.status || "GOING" },
          });
        } else {
          // Create new RSVP
          rsvp = await db.rSVP.create({
            data: {
              userId: user.id,
              eventId: params.id,
              status: body.status || "GOING",
            },
          });
        }

        return rsvp;
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Failed to RSVP" };
      }
    },
    {
      body: t.Object({
        status: t.Optional(t.String()),
      }),
    }
  );
