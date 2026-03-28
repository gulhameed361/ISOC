# ISOC Prayer Room App

![ISOC Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

A modern, cross-platform prayer timing and community app built for the Surrey Islamic Society (ISOC). This app provides real-time prayer schedules, Jumu'ah venue information, and timely notifications for the University of Surrey community.

## 🌟 Features

-   **Real-time Prayer Schedule**: Synchronized with Firestore for accurate daily times.
-   **Monthly Timetable**: Full calendar view of prayer times for the current and upcoming months.
-   **Jumu'ah Updates**: Live confirmation of Jumu'ah venues (University Hall or Rubix) with directions.
-   **Timely Notifications**: Expertly scheduled native notifications 20 seconds before Athan and Iqama.
-   **Dark/Light Mode**: Full support for system and manual theme switching.
-   **OCR Scan Support**: Built-in tool for admins to scan and upload prayer timetables from images.
-   **Native Experience**: Built with Capacitor for a smooth Android and iOS feel.

## 🛠 Tech Stack

-   **Frontend**: React + TypeScript + Vite
-   **Styling**: Vanilla CSS (Tailwind CSS compatible)
-   **Animations**: Framer Motion / Motion for React
-   **Icons**: Lucide React
-   **Mobile Framework**: Capacitor.js
-   **Backend/Database**: Firebase (Authentication, Firestore)
-   **AI Integration**: Google Gemini API (for timetable OCR parsing)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn
-   Android Studio (for Android development)

### Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/benmola/ISOC.git
    cd ISOC
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run the web dev server**:
    ```bash
    npm run dev
    ```

### Android Development

1.  **Build the web project**:
    ```bash
    npm run build
    ```

2.  **Sync with Capacitor**:
    ```bash
    npx cap sync android
    ```

3.  **Open in Android Studio**:
    ```bash
    npx cap open android
    ```

## 📂 Project Structure

-   `src/components/`: React UI components (HomeScreen, ScheduleScreen, etc.).
-   `src/hooks/`: Custom hooks for data fetching (`useSchedule`).
-   `src/services/`: External integrations (`geminiService`).
-   `src/lib/`: Utility functions and shared logic.
-   `assets/`: Static image assets and icons.
-   `android/`: Native Android project files.

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, adding features, or improving documentation.

### How to Contribute

1.  **Fork** the project.
2.  **Create a branch** for your feature (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  **Open a Pull Request**.

### Contribution Guidelines

-   **Coding Standards**: Follow the existing TypeScript and React patterns.
-   **UI/UX**: Ensure any new UI elements follow the Material Design / Glassmorphism aesthetic used in the app.
-   **Testing**: Test your changes on both the web dev server and a mobile emulator/device if possible.
-   **Notifications**: If you modify the notification logic (`src/components/Layout.tsx`), verify that they trigger at the correct relative offsets.

## 📄 License

Distributed under the MIT License.

## 📧 Contact

Surrey ISOC - [isoc@surrey.ac.uk](mailto:isoc@surrey.ac.uk)
Project Link: [https://github.com/benmola/ISOC](https://github.com/benmola/ISOC)
