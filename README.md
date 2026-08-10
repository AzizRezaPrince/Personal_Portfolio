# Aziz Reza Prince - Personal Portfolio

A sleek, modern Next.js portfolio website featuring scrollytelling animations, glassmorphism design, and an integrated **Admin Panel** for live content management.

## 🚀 Features

- **Dynamic Scrollytelling**: High-frame canvas scroll experience with animated interactive overlays.
- **Glassmorphic UI**: Tailored dark theme with modern typography, smooth gradients, and interactive micro-animations.
- **Integrated Admin Panel (`/admin`)**:
  - Live in-browser content updating for Hero, Bio, Skills, Education, Work Experience, Projects, and Contact.
  - Multi-tab synchronization and offline JSON export/backup.
  - Protected by authentication.
- **Static Export Ready**: Built for fast deployment on GitHub Pages and static hosts.

## 🌐 How to Update the Live Portfolio Directly on GitHub

You can update the live website anytime in **10 seconds** without touching any code:

1. Open [`data/portfolio.json`](data/portfolio.json) on GitHub:  
   👉 **[https://github.com/AzizRezaPrince/Personal_Portfolio/edit/main/data/portfolio.json](https://github.com/AzizRezaPrince/Personal_Portfolio/edit/main/data/portfolio.json)**
2. Click the **✏️ (Edit)** icon at the top right of the file.
3. Modify any text, skill, project, education, or contact details.
4. Click **Commit changes**.
5. GitHub Actions will automatically rebuild and deploy your changes to your live link:  
   👉 **[https://azizrezaprince.github.io/Personal_Portfolio/](https://azizrezaprince.github.io/Personal_Portfolio/)** in ~30 seconds!

## 🔐 Admin Access

- **Portal URL**: `/admin` (or [https://azizrezaprince.github.io/Personal_Portfolio/admin](https://azizrezaprince.github.io/Personal_Portfolio/admin))
- **Default Username**: `prince_aziz`
- **Default Password**: `1751dbbl`

## 🛠️ Getting Started Locally

First, install dependencies and run the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the portfolio.  
Access [http://localhost:3000/admin](http://localhost:3000/admin) to manage your portfolio data.

## 📦 Build

To build the static site export:

```bash
npm run build
```


