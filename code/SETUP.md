# Development Set-up

## Prerequisites
* Node.js (v18 or higher recommended)
* npm (Node Package Manager) or Yarn
* MySQL Server (v8.0 or higher)
* Supabase account and project (for `.tflite` storage and cross-platform synchronization)
* IDE used: Visual Studio Code (recommended)
* Android phone (for testing the SPIDTECH+ mobile app integration)
* Test files: Sample `.zip` AI model archives containing `.tflite`, `.yaml`, and metric files

## Instructions

1. Install `Node.js` and `npm` from [nodejs.org](https://nodejs.org/).
2. Install and configure your local `MySQL Server`.
3. Clone the repository and navigate into the project directory:
   ```bash
   git clone [https://github.com/yourusername/spidhive-ai-model-zoo.git](https://github.com/yourusername/spidhive-ai-model-zoo.git)
   cd spidhive-ai-model-zoo
   ```
4. Configure your environment variables. Create a `.env` file in the root backend directory with your MySQL credentials and Supabase keys:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=cropdex_db
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
5. Run the following commands to install backend dependencies and set up the Sequelize database schema:
   ```
   cd backend
   npm install
   npx sequelize-cli db:migrate
   npm run start
   ```
6. Open a new terminal instance. Run the following commands to install frontend dependencies (React, Vite, Tailwind, Shadcn) and start the web interface:
   ```
   cd frontend
   npm install
   npm run dev
   ```
7. Open your web browser and navigate to `http://localhost:5173` to access the SPIDHIVE AI Model Zoo interface.
8. Use the web interface to upload sample `.zip` AI model archives, view model details.