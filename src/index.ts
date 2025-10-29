// Load environment variables first
import { config } from "dotenv";
config();

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";
import { staticPlugin } from "@elysiajs/static";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";

// 👇 ADD THIS IMPORT
import { join } from "path";

// Initialize Prisma Client (singleton)
const db = new PrismaClient();

// 👇 ADD THIS LINE
const PUBLIC_DIR = join(process.cwd(), "public");

const app = new Elysia()
  // --- 1. Plugins & Setup ---
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
      secret: process.env.JWT_SECRET!, // Must be set in .env
    })
  )
  // 👇 UPDATE THIS LINE
  .use(staticPlugin({ prefix: "/", assets: PUBLIC_DIR }))
  // 👇 ADD THIS LINE — critical for root path
  .get("/", () => Bun.file(join(PUBLIC_DIR, "index.html")))

  // --- 2. Context Decoration ---
  .decorate("db", db)

  // --- 3. WebSocket Route ---
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

  // --- 4. HTTP Routes ---
  .use(authRoutes)
  .use(eventRoutes)

  // --- 5. Server Lifecycle ---
  .onStart(({ server }) => {
    console.log(
      `🔥 Server running at http://${server?.hostname}:${server?.port}`
    );
    console.log(
      `📚 Swagger docs at http://${server?.hostname}:${server?.port}/swagger`
    );
  })
  .onError(({ code, error, set }) => {
    if (code !== "NOT_FOUND") {
      console.error(`Error [${code}]: ${error.message}`);
    }

    if (error.name === "PrismaClientKnownRequestError") {
      set.status = 400;
      return { error: "Database error.", details: error.message };
    }
  })
  .listen(process.env.PORT || 3000);

export type App = typeof app;
