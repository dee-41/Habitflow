# HabitFlow 🌱

**Build consistency, one day at a time.**

HabitFlow is a personal productivity and habit-tracking web app designed to help you stay consistent, organize your tasks, and build better daily routines. Track your progress on a visual calendar, create custom streaks for any goal, and keep your plans organized in one place.

### 🌐 Live Demo

**[Visit HabitFlow →](https://subtle-nougat-bcff93.netlify.app/)**

---

## ✨ Features

### 📅 Interactive Calendar
- Navigate between months with an intuitive calendar interface.
- Select any date to view and organize tasks for that day.
- See task completion status at a glance.
- Track pending, completed, and overdue tasks.

### 🔥 Custom Habit Streaks
- Create streaks for any habit, subject, or personal goal.
- Mark individual days as completed using a dedicated calendar for each streak.
- Track current and longest streaks.
- Edit, archive, restore, and manage your streaks.

### ✅ Task Management
- Create tasks with or without due dates.
- Add tasks directly to specific calendar dates.
- Mark tasks as completed or pending.
- Edit and delete tasks.
- Filter and search tasks to find what you need quickly.

### 🔔 Reminders
- Organize reminders for important tasks and events.
- Keep track of upcoming commitments.

### 💾 Local Data Persistence
- Your tasks, streaks, and other supported app data are stored locally in your browser.
- Your saved data remains available when you revisit the site using the same browser and device, provided the browser's site data is not cleared.

### ⚙️ Settings
- Access app preferences and available data-management options in one place.

---

## 🛠️ Tech Stack

- **React** — Component-based user interface
- **Vite** — Development server and build tooling
- **Tailwind CSS** — Styling and responsive layouts
- **Dexie.js** — IndexedDB database management
- **date-fns** — Date manipulation and calendar utilities
- **Lucide React** — Icons
- **React Router** — Client-side navigation
- **Netlify** — Deployment

---

## 🚀 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/habitflow.git
```

**2. Navigate to the project directory**

```bash
cd habitflow
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the local URL**

Vite will display a local development URL, usually:

```text
http://localhost:5173
```

Open it in your browser to start using HabitFlow.

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```text
habitflow/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── calendar/
│   │   ├── streaks/
│   │   ├── tasks/
│   │   └── layout/
│   ├── db/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── package.json
└── README.md
```

*The structure above summarizes the main areas of the project; individual files may vary.*

---

## 🗺️ Roadmap

Potential improvements for future versions:

- [ ] Cloud synchronization across devices
- [ ] Optional user accounts and backup
- [ ] Browser notification reminders
- [ ] More detailed habit and productivity analytics
- [ ] Export and import of personal data
- [ ] Additional calendar customization options

---

## 🔒 Privacy & Data

HabitFlow currently uses browser-local storage mechanisms for supported app data rather than requiring a traditional account login.

Because this data is tied to the browser and device, it may not automatically sync across browsers or devices. Clearing site data can also remove locally stored information. Consider implementing a backup or synchronization feature if cross-device access is needed.

---

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request describing your contribution.

---

## 📄 License

No license has been specified yet. Add a license if you intend to permit others to reuse, modify, or distribute the project.

---

**Made with ❤️ to make everyday consistency easier.**

[Live Demo](https://subtle-nougat-bcff93.netlify.app/) · [GitHub Repository](https://github.com/YOUR_USERNAME/habitflow)
