# AKOA Enterprise Dashboard

Use the attached PDF as the source of truth. Recreate the complete AKOA application using React and Tailwind CSS . Match the design as closely as possible, including all pages, dashboards, charts, tables, navigation, and interactions. Use realistic mock data and a responsive dark enterprise UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5febd8ff-8386-4435-9cd8-50f8a4839fb6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Live API Connection

The dashboard now supports live AKOA API data for:

- Services page (service list, status, replicas, CPU/memory, latency, error rate)
- Metrics page (real time-series charts by service and range)

Start the backend API first from the workspace root:

```sh
cd apis
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8100
```

Then run the frontend with optional API override:

```sh
# from akoa-enterprise-dashboard-main/
set VITE_AKOA_API_BASE_URL=http://localhost:8100
npm run dev
```

If `VITE_AKOA_API_BASE_URL` is not set, the frontend defaults to `http://localhost:8100`.
