EVENT MONOLITH APP

A full-stack monolithic event management application built with Elysia.js, Prisma, PostgreSQL (Neon), WebSockets, and JWT authentication — powered by Bun for ultra-fast performance.
This app demonstrates core software design principles and integrates authentication, user roles, and real-time updates for event collaboration.

 Quick Start (Using Bun)
1. Install dependencies
bun install

2. Run the application
bun run src/index.ts

This project was created using bun init in Bun v1.3.0.
Bun is a fast all-in-one JavaScript runtime that combines a package manager, bundler, and test runner.

Overview
The app allows users to:

-Register and log in securely using JWT authentication.
-Create, edit, and delete events (for Organizers and Admins).
-RSVP to events as an attendee.
-Receive realtime updates via WebSockets when new events or RSVPs occur.
-Admin users can approve or manage all events.

It follows SOLID design principles and applies clean architecture practices within a monolithic structure — backend logic, database, and realtime communication all run together in a single service.

 Folder Structure
event-monolith-app/
├── src/
│   ├── controllers/       # Handles business logic (auth, events, RSVPs)
│   ├── middleware/        # Auth & role validation
│   ├── routes/            # API route definitions
│   ├── services/          # External integrations (email, websocket)
│   ├── utils/             # Helper utilities (JWT, error handling)
│   ├── prisma/            # Prisma schema and client setup
│   └── index.ts           # Application entry point
├── prisma/
│   └── migrations/
├── public/                # Optional static files or frontend
├── .env                   # Environment variables
├── package.json
├── tsconfig.json
└── README.md


Database (Prisma + Neon)

The app uses Prisma ORM with a PostgreSQL database hosted on Neon.tech.
Models include User, Event, and RSVP, with relationships and enums for UserRole and RSVPStatus.

Run database setup:

npx prisma generate
npx prisma migrate dev --name init

Authentication & Roles

Authentication is implemented with JWT (JSON Web Tokens), and passwords are hashed using bcrypt.

User Roles:

ADMIN: Approves and manages all events.
ORGANIZER: Creates and manages owned events.
ATTENDEE: Views and RSVPs to events.

Access control is enforced through Elysia middleware:
-Only Organizers/Admins can modify events.
-Only Admins can approve events.
-Only Attendees can RSVP.

API Endpoints

Method	Endpoint	Description	Access
POST	/signup	Register a new user (sends mock email)	Public
POST	/login	Log in and receive JWT	Public
GET	/events	Fetch all approved events	Authenticated
POST	/events	Create a new event	Organizer
PUT	/events/:id	Update an event	Organizer/Admin
DELETE	/events/:id	Delete an event	Organizer/Admin
PUT	/events/:id/approve	Approve an event	Admin
POST	/events/:id/rsvp	RSVP to an event	Attendee


Realtime Features

The app uses Elysia.js WebSocket plugin to broadcast live updates when:

-An event is created, updated, deleted, or approved.
-A user RSVPs or changes their RSVP status.

Clients connect to:

ws://localhost:3000/ws, and automatically receive updates in real-time.

Environment Setup

Create a .env file with:

DATABASE_URL="your-neon-postgres-url"
JWT_SECRET="your-secret-key"
ETHEREAL_USER="ethereal-username"
ETHEREAL_PASS="ethereal-password"

Testing (Insomnia/Postman)

You can test endpoints using Insomnia or Postman.

Example Workflow:

POST /signup → create user
POST /login → get JWT token
Add Authorization: Bearer <token> header
Test /events CRUD routes depending on role
Connect to /ws for real-time updates

Design & Architecture Reflection
  Applied Principles

Single Responsibility: Each controller, route, and service handles one responsibility.
Open/Closed: Easily extensible (e.g., adding new roles or event types).
Dependency Inversion: Services depend on interfaces, not direct implementations.
Separation of Concerns: Auth, events, and database logic isolated cleanly.
DRY: Common utilities and middleware avoid code duplication.

  Scalability & Maintainability

-Monolith architecture ensures simple deployment and debugging.
-Prisma schema enforces referential integrity.
-WebSocket broadcast pattern scales easily with Redis or Pub/Sub.
-Modular services make refactoring and testing efficient.

Technologies Used
Tool	Purpose
Bun	Runtime and package manager (fast alternative to Node.js).
Elysia.js	Backend framework (with built-in WebSocket + Swagger support).
Prisma	ORM for PostgreSQL database.
PostgreSQL (Neon)	Cloud-hosted database.
JWT	Authentication and authorization.
WebSockets	Realtime updates for events and RSVPs.
Render	Cloud deployment for the monolith app.
Insomnia/Postman	API endpoint testing.

  Deployment (Render)
 
-Push project to GitHub.
-Create a Web Service on Render.com

Connect your repo and set:

-DATABASE_URL
-JWT_SECRET
-ETHEREAL_USER
-ETHEREAL_PASS

-Deploy — your API will be live at:
-https://your-app.onrender.com
-Swagger docs → /swagger

Future Enhancements

-Add a lightweight frontend (HTML,CSS,JAVASCRIPT).
-Implement pagination & event search.
-Add email verification flow.
-Write automated tests using Bun’s test runner.
-Extend to microservice or modular monolith architecture.
