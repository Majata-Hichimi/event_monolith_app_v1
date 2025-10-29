import { config } from "dotenv";
config();

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { join } from "path";

const db = new PrismaClient();
const PUBLIC_DIR = join(process.cwd(), "public");

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
    })
  )
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Event Monolith API",
          version: "1.0.0",
        },
      },
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(staticPlugin({ prefix: "/", assets: PUBLIC_DIR }))
  .get("/", () => Bun.file(join(PUBLIC_DIR, "index.html")))
  .decorate("db", db)
  .ws("/ws", {
    open(ws) {
      console.log("WebSocket client connected", ws.id);
      ws.subscribe("events");
    },
    close(ws) {
      console.log("WebSocket client disconnected", ws.id);
      ws.unsubscribe("events");
    },
  })
  .use(authRoutes)
  .use(eventRoutes)
  .onStart(({ server }) => {
    console.log(
      `🔥 Server running at http://${server?.hostname}:${server?.port}`
    );
    console.log(
      `📚 Swagger docs at http://${server?.hostname}:${server?.port}/swagger`
    );
  })
  .onError(({ code, error, set }) => {
    console.error(`Error [${code}]: ${error.message}`);

    // Always return JSON
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found" };
    }

    set.status = 500;
    return { error: error.message || "Internal server error" };
  })
  .listen(process.env.PORT || 3000);

export type App = typeof app;
