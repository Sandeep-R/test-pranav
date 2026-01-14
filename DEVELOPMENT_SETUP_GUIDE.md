# Complete Development Setup Guide
## Cursor + Claude + Vercel + Supabase Stack

This guide documents the complete setup process for building full-stack applications using Cursor IDE, Claude AI assistant, Vercel for deployment, and Supabase as the backend. Use this as a reference for future projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Initialization](#project-initialization)
4. [Supabase Setup](#supabase-setup)
5. [Local Development](#local-development)
6. [Git & GitHub Setup](#git--github-setup)
7. [Vercel Deployment](#vercel-deployment)
8. [Cursor + Claude Workflow](#cursor--claude-workflow)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Vercel
- **IDE**: Cursor
- **AI Assistant**: Claude (via Cursor)

### Architecture

```
┌─────────────┐
│   Cursor    │ ← Development Environment
│  (Claude)   │
└──────┬──────┘
       │
       ├─→ Local Dev (npm run dev)
       │
       ├─→ Git → GitHub
       │
       └─→ Vercel → Production
              │
              └─→ Supabase (Backend)
```

---

## Prerequisites

### Required Accounts

1. **GitHub Account**
   - Sign up at https://github.com
   - Create a new repository for your project

2. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project

3. **Vercel Account**
   - Sign up at https://vercel.com
   - Connect your GitHub account

4. **Cursor IDE**
   - Download from https://cursor.sh
   - Install and sign in

### Required Software

- **Node.js** (v18 or higher)
  - Download from https://nodejs.org
  - Verify: `node --version` and `npm --version`

- **Git**
  - Usually pre-installed on macOS/Linux
  - Download from https://git-scm.com for Windows
  - Verify: `git --version`

---

## Project Initialization

### Step 1: Create React + Vite Project

```bash
# Navigate to your projects directory
cd ~/projects

# Create new project directory
mkdir my-app
cd my-app

# Initialize npm project
npm init -y

# Install core dependencies
npm install react react-dom typescript @types/react @types/react-dom vite @vitejs/plugin-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer @tailwindcss/vite

# Install shadcn/ui dependencies
npm install clsx tailwind-merge class-variance-authority lucide-react
```

### Step 2: Configure Vite

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### Step 3: Set Up shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init --defaults

# Add components as needed
npx shadcn@latest add button input card checkbox select
```

### Step 4: Configure Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### Step 2: Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public** key → Long JWT token

### Step 3: Set Up Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Create your tables (example for todos):

```sql
-- Create table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
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

-- Create indexes for performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
```

### Step 4: Enable Real-time (if needed)

1. Go to **Database** → **Replication**
2. Enable replication for tables that need real-time updates
3. Click the toggle next to your table name

### Step 5: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (default)
3. Configure email templates if needed
4. Set up email verification (optional)

---

## Local Development

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Create Environment File

Create `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Never commit `.env.local` to git
- Use `.env.example` as a template (without actual keys)

### Step 3: Set Up Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)

if (!hasSupabaseConfig) {
  console.error('Missing Supabase environment variables')
}

export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
```

### Step 4: Create Gitignore

Create/update `.gitignore`:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.vite/

# Logs
*.log

# OS files
.DS_Store
```

### Step 5: Start Development Server

```bash
npm run dev
```

Your app should be running at `http://localhost:5173`

---

## Git & GitHub Setup

### Step 1: Initialize Git Repository

```bash
# Initialize git
git init

# Configure git user (if not already set globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# For GitHub, use your GitHub email or noreply email
# Format: username@users.noreply.github.com
```

### Step 2: Set Up SSH Authentication (Recommended)

```bash
# Check if you have SSH keys
ls -la ~/.ssh/

# If no keys exist, generate one
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add SSH key to GitHub
# 1. Copy public key
cat ~/.ssh/id_ed25519.pub

# 2. Go to GitHub → Settings → SSH and GPG keys
# 3. Click "New SSH key"
# 4. Paste your public key
# 5. Save

# Test connection
ssh -T git@github.com
```

### Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create repository (don't initialize with README)
3. Copy the repository URL

### Step 4: Connect Local to GitHub

```bash
# Add remote
git remote add origin git@github.com:yourusername/your-repo.git

# Or use HTTPS
git remote add origin https://github.com/yourusername/your-repo.git

# Verify
git remote -v
```

### Step 5: First Commit

```bash
# Stage all files
git add .

# Commit
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

---

## Vercel Deployment

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository

### Step 2: Configure Project Settings

**Important Settings:**

- **Framework Preset**: Vite
- **Root Directory**: `./` (or `todo-app` if your app is in a subdirectory)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3: Add Environment Variables

1. In Vercel project settings, go to **Settings** → **Environment Variables**
2. Add each variable:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Production, Preview, Development (select all)
3. Repeat for `VITE_SUPABASE_ANON_KEY`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Cursor + Claude Workflow

### Using Cursor IDE

1. **Open Project**
   - File → Open Folder → Select your project directory
   - Cursor will detect it's a TypeScript/React project

2. **AI Chat**
   - Press `Cmd+L` (Mac) or `Ctrl+L` (Windows) to open AI chat
   - Ask Claude to help with:
     - Writing components
     - Debugging errors
     - Adding features
     - Refactoring code

3. **Inline Edits**
   - Select code → Right-click → "Ask Cursor"
   - Or use `Cmd+K` (Mac) / `Ctrl+K` (Windows) for inline edits

4. **Composer Mode**
   - Press `Cmd+I` (Mac) / `Ctrl+I` (Windows)
   - Describe what you want to build
   - Claude will generate code across multiple files

### Best Practices with Claude

1. **Be Specific**
   - Instead of "add authentication"
   - Say "add Supabase email/password authentication with login and signup forms using shadcn/ui components"

2. **Provide Context**
   - Mention your tech stack
   - Reference existing code patterns
   - Specify component library (shadcn/ui)

3. **Iterate**
   - Start with basic functionality
   - Ask for improvements
   - Request error handling

4. **Review Generated Code**
   - Always review AI-generated code
   - Test before committing
   - Ask for explanations if unclear

### Example Prompts

**Good Prompts:**
- "Add a todo status field with three options: todo, in-progress, done. Use shadcn Select component."
- "Create an authentication context using Supabase that manages user session and provides signIn, signUp, and signOut methods."
- "Add real-time synchronization for todos using Supabase subscriptions."

**Less Effective:**
- "Make it better"
- "Add features"
- "Fix bugs"

---

## Best Practices

### Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities, Supabase client
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── .env.local            # Environment variables (gitignored)
├── .env.example          # Template for env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Environment Variables

- ✅ Always use `VITE_` prefix for client-side variables
- ✅ Never commit `.env.local` to git
- ✅ Use `.env.example` as a template
- ✅ Set variables in Vercel for production
- ✅ Document required variables in README

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/new-feature
   # Then create PR on GitHub
   ```

4. **Merge to main**
   - Vercel auto-deploys from main branch

### Code Quality

- Use TypeScript strictly
- Follow existing code patterns
- Add error handling
- Implement loading states
- Use optimistic updates for better UX
- Test locally before pushing

### Documentation

- Update README.md with new features
- Document database schema changes
- Keep setup instructions current
- Add changelog entries

---

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptoms**: App shows "Configuration Error" or Supabase calls fail

**Solutions**:
- Check `.env.local` exists in project root
- Verify variable names start with `VITE_`
- Restart dev server after changing `.env.local`
- Check Vercel environment variables are set

#### 2. Build Fails on Vercel

**Symptoms**: Deployment fails with build errors

**Solutions**:
- Check build logs in Vercel dashboard
- Verify `package.json` has correct scripts
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility

#### 3. Supabase Connection Errors

**Symptoms**: "Missing Supabase environment variables" or auth fails

**Solutions**:
- Verify Supabase URL and key are correct
- Check RLS policies are set up correctly
- Ensure real-time is enabled if using subscriptions
- Check Supabase project is active (not paused)

#### 4. Git Push Fails

**Symptoms**: Permission denied or authentication errors

**Solutions**:
- Check SSH key is added to GitHub
- Verify git remote URL is correct
- Use `git remote set-url origin git@github.com:user/repo.git` for SSH
- Check git credentials: `git config --list`

#### 5. Cursor/Claude Not Working

**Symptoms**: AI features not responding

**Solutions**:
- Check Cursor is updated to latest version
- Restart Cursor
- Check internet connection
- Verify Cursor account is active

### Getting Help

1. **Check Documentation**
   - Supabase: https://supabase.com/docs
   - Vercel: https://vercel.com/docs
   - shadcn/ui: https://ui.shadcn.com
   - Vite: https://vitejs.dev

2. **Community Resources**
   - Supabase Discord
   - Vercel Discord
   - Stack Overflow (tag: supabase, vercel, vite)

3. **Debug Steps**
   - Check browser console for errors
   - Check Vercel build logs
   - Check Supabase logs (Dashboard → Logs)
   - Test locally first

---

## Quick Reference Checklist

### New Project Setup

- [ ] Create GitHub repository
- [ ] Create Supabase project
- [ ] Initialize React + Vite project
- [ ] Set up Tailwind CSS
- [ ] Initialize shadcn/ui
- [ ] Install Supabase client
- [ ] Create `.env.local` with credentials
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Enable real-time (if needed)
- [ ] Connect to GitHub
- [ ] Deploy to Vercel
- [ ] Set Vercel environment variables
- [ ] Test production deployment

### Daily Development

- [ ] Pull latest changes: `git pull`
- [ ] Create feature branch
- [ ] Make changes locally
- [ ] Test with `npm run dev`
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Verify Vercel auto-deployment

---

## Summary

This stack provides:

✅ **Fast Development**: Cursor + Claude for rapid iteration  
✅ **Type Safety**: TypeScript throughout  
✅ **Modern UI**: shadcn/ui + Tailwind CSS  
✅ **Full-Stack**: Supabase handles backend, auth, database  
✅ **Easy Deployment**: Vercel with auto-deploy from GitHub  
✅ **Real-time**: Supabase real-time subscriptions  
✅ **Scalable**: Production-ready architecture  

**Remember**: Always test locally before pushing to production!

---

**Last Updated**: 2026-01-14  
**Version**: 1.0.0
