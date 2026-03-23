# 🏢 Smart Visitor Management System 

A next-generation, secure, and highly interactive **Visitor Management System** designed to streamline facility check-ins and enhance security. Built with a blazing-fast **React + Vite** frontend and a robust **Spring Boot** backend API.

This project completely modernizes the reception desk, making it paperless, trackable, and intelligent. 

## ✨ Key Features

* **🤖 AI Concierge Chatbot (Aura)**: A fully integrated Gemini 2.5 AI chatbot in the Kiosk. Acts as a digital receptionist to answer visitor questions regarding facility details (Wi-Fi, directions, meeting rooms).
* **🖥️ Kiosk Self Check-In Mode**: A distraction-free, full-screen portal where guests can register their arrival quickly and beautifully.
* **📊 Live Analytics Dashboard**: Rich data presentation via pure-SVG interactive charts tracking hourly foot traffic, popular visit purposes, and 7-day volume trends.
* **⏱️ Real-time Tracking & Overstay Alerts**: Live second-by-second ticking durations for everyone inside the building, with automatic red flags for visits exceeding 2 hours.
* **🔐 Role-Based Access Control**: Secure login portal with distinct functionality for `Admin` and `Staff` roles.
* **⚡ Smart Auto-Fill (Returning Visitors)**: System automatically detects returning visitors by email and autofills their details for rapid reentry.
* **🖨️ Quick Administrative Utilities**: Native capabilities to "Print Visitor Pass" and "Copy Details" to clipboard straight from the Dashboard table.
* **🔔 Advanced Notifications System**: Seamless UI Toast pop-ups for all actions and native Desktop Browser Push Notifications when visitors arrive.

---

## 🛠️ Technology Stack

**Frontend:**
* React (via Vite)
* Tailwind CSS (Custom Tokens & Styling)
* Vanilla SVG (No external chart libraries)
* `@google/generative-ai` (Gemini SDK)

**Backend:**
* Java & Spring Boot (3.2.4)
* Spring Data JPA
* H2 Database (In-Memory for easy deployment)
* Lombok

---

## 🚀 Getting Started

Follow these instructions to run the project locally on your machine.

### 1. Start the Spring Boot Backend
The backend runs on an in-memory SQL database, so no external database configuration is required!

\`\`\`bash
cd backend
./mvnw spring-boot:run
\`\`\`
*(The backend runs on `http://localhost:8080`)*

### 2. Enter your Gemini API Key (Optional)
To test the "Aura Concierge" AI chatbot, you need a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
1. Go to `frontend/src/components/AIChatbot.jsx`
2. At the top of the file, insert your API key into the `API_KEY` variable.

### 3. Start the React Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
*(The frontend runs on `http://localhost:5173`)*

---

## 🔑 Default Login Credentials

Access the Dashboard and Analytics by logging in with the pre-configured accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@visitorms.com` | `admin123` | Full access to Dashboard and hidden Analytics page |
| **Staff** | `staff@visitorms.com` | `staff123` | Can view Dashboard and perform check-ins |

---

## 📸 Screenshots

*(To be added by the repository owner: Add screenshots of the Dashboard, Analytics, AI Chatbot, and Check-In form here!)*

---
*Built with ❤️ to demonstrate modern frontend architectures, AI integrations, and full-stack development patterns.*
