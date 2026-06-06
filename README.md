# Neural City

City ranking and comparison website for Indian cities. The app ranks cities using a composite score built from four metrics:

- Air Quality Index
- Crime chargesheeting rate
- Cleanliness score
- Traffic accident cases

The project has an Express backend that loads CSV data and a React frontend that displays rankings, filters, city detail pages, charts, and dark mode.

## Project Structure

```text
.
+-- backend/                 # Express API server
+-- frontend/                # Vite React app
+-- Clean Dataset/           # Clean CSV files used by the backend
+-- Datasets/                # Source/raw datasets
+-- Fetch and Clean Data/    # Data cleaning scripts
```

## Requirements

- Node.js
- npm

Use `npm.cmd` on Windows PowerShell if `npm` is blocked by execution policy.

## Install

Install backend dependencies:

```powershell
cd "G:\Code- Neural CIty\backend"
npm.cmd install
```

Install frontend dependencies:

```powershell
cd "G:\Code- Neural CIty\frontend"
npm.cmd install
```

## Run Locally

Start the backend in one terminal:

```powershell
cd "G:\Code- Neural CIty\backend"
$env:PORT=5001
npm.cmd start
```

Start the frontend in another terminal:

```powershell
cd "G:\Code- Neural CIty\frontend"
npm.cmd run dev
```

Open the website:

```text
http://localhost:5173/
```

The frontend proxies `/api` requests to the backend at `http://127.0.0.1:5001`.

## Frontend Routes

- `/` - Rankings page
- `/rankings` - Rankings page
- `/city/:cityName` - City detail page

## Backend API

- `GET /api/health` - Backend health check
- `GET /api/cities` - Ranked city list
- `GET /api/cities/:cityName` - Detailed city profile

Example:

```text
http://localhost:5001/api/cities/Ahmedabad
```

## Build Frontend

```powershell
cd "G:\Code- Neural CIty\frontend"
npm.cmd run build
```

Preview the production build:

```powershell
npm.cmd run preview
```

## Features

- Sortable city rankings table
- Search by city or state
- State filter
- Minimum composite score slider
- City detail pages with metric cards
- AQI pollutant breakdown
- Cleanliness trend line chart
- Crime statistics
- Traffic accident breakdown chart
- Dark mode toggle with saved preference
- Responsive layout for mobile and desktop

## Troubleshooting

If the page is blank, make sure both servers are running:

```text
Frontend: http://localhost:5173/
Backend:  http://localhost:5001/
```

Check that the frontend can reach the API through Vite:

```text
http://localhost:5173/api/cities
```

It should return a JSON list of cities. If it does not, restart both servers.

If PowerShell blocks `npm`, use `npm.cmd` instead.
