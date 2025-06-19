# 🧠 Task Management System (PERN Stack)

A robust task management web app built using the PERN stack (PostgreSQL, Express.js, React.js, Node.js). This system supports advanced role-based delegation, importance/urgency scoring, project/area categorization, and dynamic task views.

## 🚀 Features

### ✅ Task Core

    Create, assign, and manage tasks with title, description, deadline, importance, and urgency.

    Status options: pending, completed, and automatic archive for expired tasks.

### 👥 Roles & Permissions

    Managers: Full access. Can assign to projects or areas, delegate multilayer tasks.

    HR: Can assign to areas, manage users.

    Team Leads: Can assign only to projects.

    Members: Can assign standalone tasks with no project/area.

### 📌 Projects & Areas

    Tasks can be grouped under projects or areas.

    Filtered dashboards for project and area views.

### 📦 Delegation

    Multilayer delegation supported (a supervisor can delegate a task to another subordinate).

    Each task assignment includes custom Importance & Urgency scores.

    TaskCards reflect type (Do, Schedule, Delegate, Eliminate) visually with color-coded borders and backgrounds based on per-assignee scores.

### 🎨 TaskCard UI

    Color-coded task type for assignees (using assigned scores).

    “Delegated by: [name]” tag appears for assignees.

    Blue badge for unassigned delegate tasks (ready to be assigned).

    Red badge for assigned delegate tasks.

### 🔔 Notifications

    Realtime notification counter and seen-state tracking.

    Bell icon updates when new tasks are assigned.

### 🔍 Filtering & Search

    Search functionality for tasks, users, projects, and areas.

    Scrollable UI components with overflow for large lists.

## 🛠 Tech Stack

    Frontend: React.js (Vite), Context API, CSS

    Backend: Express.js, Node.js

    Database: PostgreSQL with pg package

    Authentication: JWT-based auth

    Other Tools: PGAdmin, GitHub, Figma (for UI prototyping)

## 🗃 Folder Structure

    ├── backend/
    │   ├── controllers/
    │   │   └── taskController.js
    │   ├── routes/
    │   │   └── taskRoutes.js
    │   ├── db.js
    │   └── index.js
    ├── frontend/
    │   └── src/
    │       ├── api/
    │       │   └── tasks.js
    │       ├── components/
    │       │   ├── TaskCard.jsx
    │       │   ├── DelegateModal.jsx
    │       │   └── ...
    │       ├── utils/
    │       │   └── getTaskColor.js
    │       ├── AuthContext.jsx
    │       └── App.jsx

## ⚠️ Still In Progress

    Admin user management (delete, update)

    Task details modal (enhanced view/edit)

    Dashboard filters & sorting enhancements

    Tests and form validation

## 🧪 How to Run

    1. Start PostgreSQL and ensure your DB is configured

    2. Backend
        cd backend
        npm install
        node index.js

    3. Frontend
        cd frontend
        npm install
        npm run dev

## 📄 License

    MIT
