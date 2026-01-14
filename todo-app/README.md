# Todo App - Documentation

## Overview

A modern, full-stack todo application built with React, TypeScript, and Supabase. Features user authentication, real-time synchronization, and cross-device access. The app allows users to create, manage, and track todos with status tracking (To Do, In Progress, Done).

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI component library
  - Button
  - Input
  - Card
  - Checkbox
  - Select
  - Tabs
  - Label
- **Lucide React** - Icons

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - Authentication (Email/Password)
  - PostgreSQL Database
  - Real-time subscriptions
  - Row Level Security (RLS)

## Features

### Authentication
- User sign up with email/password
- User login with email/password
- Session persistence across page refreshes
- Secure logout functionality
- Protected routes (todos only accessible when authenticated)

### Todo Management
- **Create todos** - Add new tasks with optional status
- **Complete todos** - Mark tasks as completed/incomplete
- **Update status** - Change task status (To Do, In Progress, Done)
- **Delete todos** - Remove individual tasks
- **Clear completed** - Bulk delete all completed tasks
- **Real-time sync** - Changes sync across all devices/tabs instantly
- **Progress tracking** - Visual progress bar showing completion percentage

### Status System
- **To Do** (Gray) - New/unstarted tasks
- **In Progress** (Blue) - Tasks currently being worked on
- **Done** (Green) - Completed tasks

## Project Structure

```
todo-app/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx      # Modal wrapper for login/signup
│   │   │   ├── LoginForm.tsx      # Login form component
│   │   │   └── SignupForm.tsx     # Signup form component
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       └── tabs.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context provider
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client initialization
│   │   └── utils.ts               # Utility functions (cn helper)
│   ├── types/
│   │   └── database.ts            # TypeScript types for database
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles and Tailwind config
├── .env.local                      # Environment variables (not in git)
├── components.json                 # shadcn/ui configuration
├── index.html                      # HTML template
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration
```

## Database Schema

### Table: `todos`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, FOREIGN KEY (auth.users) | Owner of the todo |
| `text` | TEXT | NOT NULL | Todo task description |
| `completed` | BOOLEAN | DEFAULT false | Completion status |
| `status` | TEXT | CHECK ('todo', 'in-progress', 'done'), DEFAULT 'todo' | Task status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

### Row Level Security (RLS) Policies

All RLS policies ensure users can only access their own todos:

- **SELECT**: `auth.uid() = user_id` - Users can only read their own todos
- **INSERT**: `auth.uid() = user_id` - Users can only create todos for themselves
- **UPDATE**: `auth.uid() = user_id` - Users can only update their own todos
- **DELETE**: `auth.uid() = user_id` - Users can only delete their own todos

### Indexes

- `idx_todos_user_id` - Index on `user_id` for faster user-specific queries
- `idx_todos_created_at` - Index on `created_at` for faster sorting

## Architecture

### Authentication Flow

```
User → AuthModal (Login/Signup) → Supabase Auth → Session Created
  ↓
AuthContext updates → User state set → App renders TodoApp
```

### Data Flow

```
User Action → Optimistic UI Update → Supabase API Call
  ↓
Success: Real-time subscription updates UI
Error: Revert optimistic update, show error
```

### Real-time Synchronization

The app uses Supabase real-time subscriptions to listen for database changes:

- **INSERT** events - New todos added
- **UPDATE** events - Todos modified (status, completion)
- **DELETE** events - Todos removed

Changes are automatically synced across all open tabs/devices.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` in the `todo-app/` directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   Get these values from your Supabase project settings:
   - Go to Project Settings → API
   - Copy "Project URL" → `VITE_SUPABASE_URL`
   - Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

4. **Set up Supabase database**
   
   Run this SQL in the Supabase SQL Editor:
   ```sql
   -- Create todos table
   CREATE TABLE todos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     text TEXT NOT NULL,
     completed BOOLEAN DEFAULT false,
     status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable RLS
   ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   CREATE POLICY "Users can view own todos"
     ON todos FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own todos"
     ON todos FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own todos"
     ON todos FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own todos"
     ON todos FOR DELETE
     USING (auth.uid() = user_id);

   -- Indexes
   CREATE INDEX idx_todos_user_id ON todos(user_id);
   CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
   ```

5. **Enable Real-time**
   
   In Supabase Dashboard:
   - Go to Database → Replication
   - Enable replication for the `todos` table

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Build for production**
   ```bash
   npm run build
   ```

## Development Workflow

### Adding New Features

1. **Update this documentation** - Add the new feature to the Features section
2. **Update database schema** - If database changes are needed, document them in the Database Schema section
3. **Update architecture** - If the data flow changes, update the Architecture section
4. **Update setup instructions** - If new setup steps are required

### Code Style

- Use TypeScript for all new files
- Follow existing component patterns
- Use shadcn/ui components when possible
- Implement optimistic updates for better UX
- Handle errors gracefully with rollback logic

### Testing Checklist

Before committing changes:

- [ ] User can sign up and log in
- [ ] Todos persist after page refresh
- [ ] Real-time sync works (test in multiple tabs)
- [ ] RLS policies prevent cross-user access
- [ ] Error handling works (test with network offline)
- [ ] Optimistic updates revert on error

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Set root directory to `todo-app`
3. Set framework preset to "Vite"
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### Environment Variables in Production

Ensure all environment variables are set in your deployment platform's settings.

## Known Limitations

- No offline support (requires internet connection)
- No email verification required for signup
- No password reset functionality (can be added)
- No todo categories/tags (can be added)
- No due dates (can be added)

## Future Enhancements

Potential features to add:

- [ ] Email verification
- [ ] Password reset
- [ ] Todo categories/tags
- [ ] Due dates and reminders
- [ ] Todo search and filtering
- [ ] Todo sorting options
- [ ] Dark/light theme toggle
- [ ] Export todos (CSV/JSON)
- [ ] Todo sharing/collaboration
- [ ] Mobile app (React Native)

## Changelog

### Version 1.0.0 (Current)
- Initial release
- User authentication (email/password)
- Todo CRUD operations
- Status tracking (To Do, In Progress, Done)
- Real-time synchronization
- Progress tracking
- Responsive design with shadcn/ui components

---

**Last Updated**: 2026-01-14  
**Maintained by**: Sandeep-R  
**Repository**: https://github.com/Sandeep-R/test-pranav
