# GH Chess Cup Website Setup Guide

Follow these steps to host your live tournament website for free using **Firebase Realtime Database** and **GitHub Pages**.

---

### Step 1: Set Up Free Database (Firebase)
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project named **GH-Chess-Cup**.
2. Click **Build -> Realtime Database** and click **Create Database**.
3. Choose location (e.g., Asia) and select **Start in Test Mode**.
4. In database settings, copy your web configuration parameters (`apiKey`, `databaseURL`, `projectId`, etc.).
5. Open `firebase-config.js` in VS Code and replace the placeholder values in `firebaseConfig` with your real keys.

---

### Step 2: Push Code to GitHub
1. Create a free account at [GitHub](https://github.com/).
2. Create a new repository named `gh-chess-cup` and make it **Public**.
3. Push all 5 files (`index.html`, `styles.css`, `app.js`, `firebase-config.js`, `README.md`) to your GitHub repository.

---

### Step 3: Publish Live Website (GitHub Pages)
1. Go to your repository settings on GitHub: **Settings -> Pages**.
2. Under **Build and deployment -> Branch**, select `main` (or `master`) and folder `/ (root)`.
3. Click **Save**.
4. In a few seconds, GitHub will give you a live URL like:
   `https://<your-username>.github.io/gh-chess-cup/`

---

### How to Use Admin Controls
- Go to the **Admin** tab.
- Login with password: `pulchowk123` *(You can change this in `app.js` under `loginAdmin()`)*.
- **Group Setup:** Add player names for Groups A, B, C, D (4 to 5 players per group).
- **Schedule Match:** Select White vs Black to create a fixture.
- **Record Match:** Select scheduled match and enter who won. All tables, leaderboards, and GHelo ratings automatically update in real-time across the internet!
