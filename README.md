# WAMCPanel (Minecraft Server Panel)

WAMCPanel (Web-based Minecraft Control Panel) is a modern, state-of-the-art server administration dashboard. It allows you to host, manage, monitor, and configure multiple Minecraft server instances dynamically via Docker containers. Built with Next.js, Express, Prisma, and Dockerode.

## Core Features
* **Multi-Instance Deployment**: Easily spin up and delete Minecraft servers running different software engines (Vanilla, Paper, Fabric, Velocity, etc.) and versions.
* **Real-time Performance Indicators**: Live CPU, RAM, and disk storage consumption monitors for the host VPS and each individual game container.
* **Dynamic Active Players tracking**: Real-time connected players lists complete with ping metrics and operator status.
* **Resource Controls**: In-browser interactive console, terminal logs streams, SFTP access details, and power buttons (Start, Stop, Restart, Kill).
* **Backup Management**: Create, view, and restore zipped server backups directly from the web interface.
* **Plugin Installer**: View, toggle, and upload plugins dynamically for Paper/Spigot instances.
* **Safe Confirmations**: Double-verification checks before critical actions (such as typing the server's name to delete it) to prevent accidental data loss.

---

## 🚀 Production VPS Deployment (For Normal Users)

To deploy WAMCPanel on any VPS (Ubuntu/Debian) automatically:

### 1. Initialize the Environment
Run our automated bootstrap script on your hosting server to install Docker, Node.js, Git, and configure group permissions:

```bash
curl -fsSL https://raw.githubusercontent.com/arielbatoon09/wamcpanel/master/scripts/installation.sh | sudo bash
```

### 2. Configure Environment variables
Open the auto-created `.env` file in the root directory to customize your database passwords and JWT secrets:
```bash
cd /opt/wamcpanel
nano .env
```

### 3. Start WAMCPanel via Docker Compose
Build and run the entire stack (PostgreSQL, Redis, Backend, and Frontend containers) in detached daemon mode:
```bash
docker compose up -d --build
```
The panel dashboard will now be accessible at `http://your-vps-ip:3000`.

---

## 🛠️ Local Development Setup

To run and contribute to the WAMCPanel repository locally:

### Prerequisites
* **Docker Desktop** running and configured.
* **Node.js** (v20 LTS recommended).
* **Git**.

### 1. Clone & Install Dependencies
Clone the repository to your local machine:
```bash
git clone https://github.com/arielbatoon09/wamcpanel.git
cd wamcpanel
```
Install dependencies individually for the backend and frontend:
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd frontend && npm install
```

### 2. Configure Environment variables
Rename the environment templates in both workspace folders and customize them:
* **Backend**: Rename `backend/.env.example` to `backend/.env`
* **Frontend**: Rename `frontend/.env.example` to `frontend/.env`

### 3. Initialize Database & Prisma
Under `/backend`, generate the Prisma client and run the database migrations:
```bash
cd ../backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Development Servers
Start the dev servers by running `npm run dev` in their respective folders:
* **Backend Web server**:
  ```bash
  cd backend && npm run dev
  ```
  *(Runs on `http://localhost:8000`)*
* **Frontend Hot Reload**:
  ```bash
  cd frontend && npm run dev
  ```
  *(Runs on `http://localhost:3000`)*

---

## 🤝 Contribution Guidelines

We welcome contributions to WAMCPanel! To submit changes:

1. **Fork** the repository and create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Commit** your changes following standard guidelines:
   ```bash
   git commit -m "feat: add amazing feature details"
   ```
3. **Push** to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
4. Open a **Pull Request** explaining your implementation details.