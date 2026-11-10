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

MySQL is the program that stores the application's accounts, crop information,
annotations, and AI model information. You do not need to understand databases
to install it; follow the steps below.

### Download MySQL

Use the official MySQL download pages:

- [MySQL Installer for Windows](https://dev.mysql.com/downloads/installer/)
- [MySQL Workbench for Windows](https://dev.mysql.com/downloads/workbench/)

The **MySQL Installer for Windows** is the easiest option because it can install
both MySQL Server and MySQL Workbench. Workbench is a graphical application that
lets you open and manage the database without typing every command.

### Install MySQL Server and Workbench

1. Open the [MySQL Installer for Windows](https://dev.mysql.com/downloads/installer/)
   page.
2. Download **mysql-installer-community**. Choose the larger file if you are
   unsure; it includes the files needed for installation.
3. Open the downloaded installer. Allow it to make changes if Windows asks.
4. When asked for a setup type, choose **Developer Default**. This installs
   MySQL Server and useful tools, including Workbench.
5. Continue through the installer. If it asks to install supporting software,
   allow it to do so.
6. When the installer asks for a MySQL root password, create one and write it
   down somewhere safe. The username is usually `root`.
7. Leave the port as `3306` unless you already use that port for another
   program.
8. Complete the installation and make sure MySQL Server is configured to start
   as a Windows service.

The `root` account is the local administrator account used by this setup. The
password is the one you created during installation; it is not the password for
GitHub, Supabase, or Windows.

### Confirm that MySQL is running

Open **MySQL Workbench** from the Windows Start menu. On the first screen,
double-click the local connection, usually named **Local instance MySQL80**.
Enter the root password you created above. If Workbench opens a page with a
list of database tools on the left, MySQL is working.

If the connection cannot be opened, restart the computer and try again. You can
also open the Windows **Services** application, find a service named
**MySQL80**, and choose **Start**.

### Import the SQL database dump

The repository includes
[`spidhive_schema_update_2026.sql`](./spidhive_schema_update_2026.sql). This is
a complete MariaDB/MySQL dump through 2026. In simple terms, it is a saved copy
of the project's database. It creates the `spidhive` database, creates the
tables, imports the data, and applies the recorded schema updates. It is not an
empty schema migration.

Before importing, make sure:

- MySQL Server is running.
- You are in the repository's `code` folder.
- You know the root password created during MySQL installation.

From PowerShell, invoke `cmd.exe` to import it with the MySQL client:

```powershell
cmd /c "mysql -u root -p < spidhive_schema_update_2026.sql"
```

When the command asks for a password, type the MySQL root password and press
Enter. Nothing will appear on the screen while you type; this is normal.

If Windows says that `mysql` is not recognized, use the full installation path
instead:

```powershell
cmd /c """C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"" -u root -p < spidhive_schema_update_2026.sql"
```

### Import using MySQL Workbench instead

If you prefer using MySQL Workbench, you can use either of the following methods:

#### Method 1: Open SQL Script
1. Open a connection to the local MySQL server.
2. Select **File > Open SQL Script**.
3. Open `code\spidhive_schema_update_2026.sql`.
4. Press the lightning-bolt **Execute** button.
5. Wait for the script to finish. The file is large, so this may take a few
   minutes.
6. In the **Schemas** panel on the left, click the refresh button and confirm
   that a database named `spidhive` appears.

#### Method 2: Data Import Tool
1. Open a connection to the local MySQL server.
2. In the top navigation bar, go to **Server > Data Import**.
3. Under **Import Options**, select **Import from Self-Contained File**.
4. Click the file selector button `...` and browse to select `code\spidhive_schema_update_2026.sql`.
5. Click **Start Import** in the bottom-right corner.
6. Wait for the import process to complete, then click the refresh button in the **Schemas** panel on the left to confirm that the `spidhive` database appears.

To check that the import worked, open a new Workbench query tab and run:

```sql
USE spidhive;
SHOW TABLES;
SELECT COUNT(*) FROM cropdex_users;
```

Press the lightning-bolt **Execute** button. You should see a list of tables and
a count returned for `cropdex_users`. If you see an error, check that you
selected the correct MySQL connection and that the import finished.

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

1. Sign in with the authorized super-admin account:
   `rlbelleza@up.edu.ph`.
2. Obtain the password privately from the project administrator. Do not add the
   password to this file, Git, screenshots, or public messages.
3. Open the AI model upload page.
4. Select the ZIP archive and upload it.
5. Confirm that the model metadata is saved in MySQL.
6. Confirm that the `.tflite` file is stored in the Supabase `ai-models`
   bucket when the upload includes one.