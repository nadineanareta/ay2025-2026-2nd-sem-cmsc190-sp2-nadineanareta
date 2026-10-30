# SPIDHIVE Development Setup

This guide sets up the SPIDHIVE backend, frontend, MySQL database, and Supabase
storage used by the AI model upload workflow.

## Prerequisites

- Windows 10/11
- Node.js 18 or later and npm
- MySQL Server 8 or later (MySQL Workbench is optional)
- A Supabase project with access to the `ai-models` storage bucket
- Git
- Visual Studio Code (recommended)

## 1. Clone the repository

Open PowerShell and run:

```powershell
git clone https://github.com/nadineanareta/ay2025-2026-2nd-sem-cmsc190-sp2-nadineanareta.git
cd ay2025-2026-2nd-sem-cmsc190-sp2-nadineanareta\code
```

The application code is inside the `code` directory. The commands below assume
that PowerShell is open in this directory.

## 2. Install and start MySQL

Install MySQL Server and remember the username and password for a local
administrative account. Make sure the MySQL service is running before importing
the database.

### Import the SQL database dump

The repository includes
[`spidhive_schema_update_2026.sql`](./spidhive_schema_update_2026.sql). This is
a complete MariaDB/MySQL dump through 2026. It creates the `spidhive` database,
creates the tables, imports the data, and applies the recorded schema updates.
It is not an empty schema migration.

From PowerShell, invoke `cmd.exe` to import it with the MySQL client:

```powershell
cmd /c "mysql -u root -p < spidhive_schema_update_2026.sql"
```

Enter the MySQL password when prompted. If `mysql` is not recognized, run the
client using its full installation path, for example:

```powershell
cmd /c """C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"" -u root -p < spidhive_schema_update_2026.sql"
```

Alternatively, in MySQL Workbench:

1. Open a connection to the local MySQL server.
2. Select **File > Open SQL Script** and open
   `code\spidhive_schema_update_2026.sql`.
3. Execute the complete script.
4. Refresh the schemas and confirm that `spidhive` exists.

Verify the import from the MySQL client:

```sql
USE spidhive;
SHOW TABLES;
SELECT COUNT(*) FROM cropdex_users;
```

Do not run `npx sequelize-cli db:migrate` after importing this dump unless you
have confirmed that a migration has not already been included. The dump already
contains the current tables and the `SequelizeMeta` records for the recovered
updates.

> **Security:** The SQL file contains a full data export and may contain
> personal data and password hashes. Use it only in an authorized development
> environment. Do not publish database credentials, Supabase service-role keys,
> or an unredacted dump in a public repository.

## 3. Configure the backend

Create `backend\.env` locally. Do not commit this file. Use the credentials for
the MySQL account used in the previous step and the Supabase project used by
your team:

```dotenv
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=spidhive
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The backend loads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with
`dotenv`. The service-role key is server-only and must never be placed in the
frontend or committed to Git.

The Sequelize connection settings are in
[`backend/config/config.json`](./backend/config/config.json). If the local
database username, password, host, or database name differs from the values
there, update the development settings locally. Keep credentials out of
commits.

Install dependencies and start the backend:

```powershell
cd .\backend
npm install
npm run start
```

The backend runs on `http://localhost:3001`.

## 4. Configure and start the frontend

Open a second PowerShell window and return to the `code` directory:

```powershell
cd path\to\ay2025-2026-2nd-sem-cmsc190-sp2-nadineanareta\code\frontend
npm install
npm run start
```

Open `http://localhost:5173` in a browser. The frontend calls the backend at
`http://localhost:3001`, so both processes must be running.

## 5. Test an AI model upload

Use an authorized sample ZIP archive containing the model files expected by the
upload page, such as `.pt`, `.tflite`, `.yaml`, metrics, and graph files. In
the web interface:

1. Sign in with a development account.
2. Open the AI model upload page.
3. Select the ZIP archive and upload it.
4. Confirm that the model metadata is saved in MySQL.
5. Confirm that the `.tflite` file is stored in the Supabase `ai-models`
   bucket when the upload includes one.
