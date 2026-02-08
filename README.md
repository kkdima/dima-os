# Dima OS Dashboard

A mobile-first static dashboard for personal productivity. Built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- Clean iOS-like card UI
- Dark mode toggle (persisted)
- Search filter for links
- Quick stats (date/time, weather placeholder, trading guardrails)
- Quick Add sheet with Telegram command templates
- Fully static - no backend required

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Edit `src/data/links.ts` to customize your links and sections.

## Deployment to GitHub Pages

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main`.

### Setup

1. Push this repo to GitHub
2. Go to **Settings** > **Pages**
3. Under "Build and deployment", select **GitHub Actions** as the source
4. Push to `main` - the workflow will automatically build and deploy

The site will be available at: `https://<username>.github.io/dima-os-dashboard/`

### Manual Deployment

```bash
npm run build
# Upload the contents of `dist/` to your hosting provider
```

## Tech Stack

- [Vite](https://vite.dev/) - Build tool
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling
