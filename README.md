# ☁️ Cloud-Based Event Handling & RSVP System

A modern **cloud-based event management and RSVP platform** built using **React.js and Firebase**. The application allows organizers to create and manage events while attendees can discover events, register through RSVP, view event details, and manage their participation.

The project demonstrates how cloud services can be integrated into a web application for **authentication, real-time data management, event handling, and user-specific dashboards**.

---

## 🚀 Project Overview

Managing events manually can become difficult when dealing with registrations, attendee information, event details, and participation tracking.

This project provides a centralized cloud-based platform where:

* 👤 Users can create accounts and log in securely.
* 📅 Organizers can create and manage events.
* 🎟️ Attendees can browse available events.
* ✅ Attendees can RSVP to events.
* 📊 Organizers can monitor event registrations.
* 📱 Users can access the system through a responsive web interface.
* ☁️ Event and user data are stored in Firebase Cloud Firestore.

---

## ✨ Features

### 🔐 Authentication

* User registration
* User login
* Logout functionality
* Firebase Authentication
* User-specific access

### 👨‍💼 Organizer Features

* Organizer dashboard
* Create new events
* Add event title, date, time and venue
* Add event description
* View created events
* Monitor attendee registrations
* Manage event information

### 👤 Attendee Features

* Attendee dashboard
* Browse available events
* View event details
* RSVP for an event
* View registered events
* Track participation

### 📅 Event Management

Each event can contain:

* Event title
* Description
* Date
* Time
* Venue
* Organizer information
* Registration/RSVP information

### 🎟️ RSVP System

The RSVP system allows attendees to:

1. Select an event.
2. View event information.
3. Register for the event.
4. Store their RSVP information in Firestore.
5. View their registered events.

### 📱 Responsive UI

The frontend is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile screens

---

## 🛠️ Technologies Used

| Technology              | Purpose                 |
| ----------------------- | ----------------------- |
| React.js                | Frontend development    |
| Vite                    | Development environment |
| Firebase Authentication | User authentication     |
| Firebase Firestore      | Cloud database          |
| JavaScript              | Application logic       |
| HTML5                   | Structure               |
| CSS3                    | Styling                 |
| Git & GitHub            | Version control         |

---

## ☁️ Cloud Architecture

```text
                  ┌─────────────────────┐
                  │       User          │
                  │ Browser / Mobile    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    React + Vite     │
                  │     Frontend        │
                  └──────────┬──────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
       ┌─────────────────┐       ┌─────────────────┐
       │ Firebase Auth   │       │ Cloud Firestore │
       │                 │       │                 │
       │ Login/Register  │       │ Events          │
       │ User Sessions   │       │ RSVPs           │
       └─────────────────┘       │ User Data       │
                                 └─────────────────┘
```

---

## 📂 Project Structure

```text
cloud-event-rsvp/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── firebase.js
│   ├── main.jsx
│   └── assets/
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/cloud-event-rsvp.git
```

Move into the project directory:

```bash
cd cloud-event-rsvp
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Start the development server

```bash
npm run dev
```

Vite will provide a local URL similar to:

```text
http://localhost:5173/
```

Open the URL in your browser.

---

# 🔥 Firebase Configuration

## Step 1 — Create Firebase Project

Go to the Firebase Console and create a new Firebase project.

Enable:

* Firebase Authentication
* Cloud Firestore

---

## Step 2 — Enable Authentication

Open:

**Firebase Console → Authentication → Sign-in method**

Enable:

```text
Email/Password
```

---

## Step 3 — Create Firestore Database

Open:

**Firebase Console → Firestore Database**

Create the database and select the appropriate development/production configuration for your project.

---

## Step 4 — Register Web App

Inside your Firebase project:

```text
Project Settings
      ↓
Your Apps
      ↓
Web App
```

Register the React application.

Firebase will provide configuration values such as:

```text
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

Add these values to your Firebase configuration file.

---

# 🗄️ Firestore Collections

The application can use collections such as:

```text
users
events
rsvps
```

### users

Example:

```text
users
 └── userId
      ├── name
      ├── email
      └── role
```

Roles can include:

```text
organizer
attendee
```

---

### events

Example:

```text
events
 └── eventId
      ├── title
      ├── description
      ├── date
      ├── time
      ├── venue
      └── organizerId
```

---

### rsvps

Example:

```text
rsvps
 └── rsvpId
      ├── eventId
      ├── userId
      ├── userName
      └── createdAt
```

---

# 🔄 Application Workflow

```text
             START
               │
               ▼
        User Registration
               │
               ▼
             Login
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    Organizer      Attendee
        │             │
        ▼             ▼
 Create Event    Browse Events
        │             │
        ▼             ▼
 Store Event      Select Event
 in Firestore        │
        │             ▼
        │            RSVP
        │             │
        └──────┬──────┘
               ▼
        Cloud Firestore
               │
               ▼
          Event Data
          & RSVPs
```

---

# 🎯 Learning Objectives

This project demonstrates practical implementation of:

* Cloud computing concepts
* Firebase Authentication
* Cloud Firestore
* CRUD operations
* React component development
* Role-based application flow
* Cloud database integration
* Event management
* RSVP/registration workflows
* Responsive frontend development
* Git and GitHub version control

---

# 🔮 Future Enhancements

Possible future improvements include:

* 📱 QR-code based event check-in
* 📧 Email RSVP confirmation
* 🔔 Event notifications
* 📊 Advanced organizer analytics
* 🔎 Event search and filtering
* 🗓️ Calendar integration
* 🏷️ Event categories
* 👥 Attendee management
* 📍 Location/map integration
* 🌐 Firebase Hosting deployment
* 📈 Event attendance statistics

---

# 🔐 Security Considerations

The application uses Firebase Authentication for user authentication and Cloud Firestore for cloud data management.

For a production deployment, Firestore Security Rules should be configured so that:

* Users can access only permitted data.
* Organizers can manage their own events.
* Attendees can create valid RSVPs.
* Unauthorized users cannot modify event or RSVP records.

---

# 📸 Project Screenshots

Add screenshots of your application here:


<img width="1366" height="768" alt="Screenshot 2026-09-26 160552" src="https://github.com/user-attachments/assets/ae6ccf76-1c08-46d8-8115-05381ac25247" />
<img width="1366" height="768" alt="Screenshot 2026-09-26 160747" src="https://github.com/user-attachments/assets/a5c45b81-9878-4c62-aa0f-ca36c7ec33f6" />
<img width="1366" height="768" alt="Screenshot 2026-09-26 160628" src="https://github.com/user-attachments/assets/b20212f6-8e68-4cac-9ff3-68f691b3db03" />
<img width="1366" height="768" alt="Screenshot 2026-09-26 160944" src="https://github.com/user-attachments/assets/1507c225-0847-4bae-a3e8-c93a2eccc212" />
<img width="1366" height="768" alt="Screenshot 2026-09-26 160924" src="https://github.com/user-attachments/assets/81a10e0b-1e1a-4be7-931d-9f0fe01cd1b0" />


Example:

```markdown
![Login Page](screenshots/login.png)

![Organizer Dashboard](screenshots/organizer-dashboard.png)

![Attendee Dashboard](screenshots/attendee-dashboard.png)
```

---

# 💻 Local Development

Run the project with:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🌐 Deployment

The application can be deployed using services such as:

* Firebase Hosting
* Vercel
* Netlify

A future version can be connected to a custom domain.

---

# 👩‍💻 Author

**Your Name**

B.Tech — Electronics and Computer Engineering

GitHub:
`https://github.com/YOUR-USERNAME`

LinkedIn:
`https://linkedin.com/in/YOUR-PROFILE`

---

# ⭐ Project Highlights

```text
☁️ Cloud-Based Application
🔐 Firebase Authentication
🗄️ Cloud Firestore Database
📅 Event Management
🎟️ RSVP Registration
👥 Organizer & Attendee Roles
⚛️ React.js Frontend
📱 Responsive UI
🚀 Deployment Ready
```

---

## 📄 License

This project is developed for **educational and portfolio purposes**.

---

⭐ If you find this project useful, consider giving the repository a star!
