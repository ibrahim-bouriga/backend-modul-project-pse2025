# Backend Modul Project

This is a minimal setup with TypeScript frontend and Express backend.

## Project Structure

```
backend-modul-project/
├── packages/
│   ├── frontend/          # TypeScript frontend
│   │   ├── public/        # Static files
│   │   │   ├── index.html # Home page
│   │   │   ├── styles.css # Styles
│   │   │   └── app.js     # Client-side JS
│   │   ├── src/           # TypeScript source
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── backend/           # Express backend
│       ├── src/
│       │   └── index.ts   # Express server
│       ├── package.json
│       └── tsconfig.json
└── package.json           # Root package.json
```