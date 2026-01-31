# 🚀 Quick Start Guide - Database Setup

## ✅ Prerequisites Check

Before running the database setup, ensure:

1. **PostgreSQL is installed**
   ```bash
   # Check if installed
   psql --version
   
   # If not installed (macOS):
   brew install postgresql@16
   ```

2. **PostgreSQL is running**
   ```bash
   # Start PostgreSQL (macOS with Homebrew)
   brew services start postgresql@16
   
   # Or use postgres command
   postgres -D /usr/local/var/postgresql@16
   
   # Check status
   brew services list | grep postgresql
   ```

## 📦 Installation Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE ams_db;

# Exit psql
\q
```

Or use createdb:
```bash
createdb ams_db
```

### Step 3: Configure Environment

Your `.env.local` file should contain:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ams_db

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ams_db
DB_USER=postgres
DB_PASSWORD=postgres
```

**Update the credentials** to match your PostgreSQL setup.

### Step 4: Check Connection

```bash
npm run db:check
```

Expected output:
```
✅ Database connection successful!
📅 Server time: ...
🐘 PostgreSQL version: ...
```

### Step 5: Run Complete Setup

```bash
npm run db:setup
```

This will:
- ✅ Create all tables and relationships
- ✅ Set up triggers and functions
- ✅ Seed initial data (roles, users, courses, etc.)

Expected output:
```
🚀 Starting complete database setup...
1️⃣  Checking database connection...
✅ Connected to database
...
🎉 Database setup completed successfully!
```

## 🎯 What Gets Created

### Roles (7)
- SuperAdmin
- Admin
- AdmissionStaff
- DocumentOfficer
- AccountsOfficer
- Principal
- Director

### Default Users (All password: `password123`)
- superadmin@college.edu
- admin@college.edu
- admission@college.edu
- documents@college.edu
- accounts@college.edu
- principal@college.edu
- director@college.edu

### Courses (8)
- Computer Science and Engineering (CSE)
- Electronics and Communication Engineering (ECE)
- Electrical and Electronics Engineering (EEE)
- Mechanical Engineering (MECH)
- Civil Engineering (CIVIL)
- Information Technology (IT)
- AI and Machine Learning (AI-ML)
- Data Science (DS)

### Document Types (10)
- SSC Certificate
- Intermediate Certificate
- Transfer Certificate
- Migration Certificate
- Character Certificate
- Caste Certificate
- Income Certificate
- Aadhar Card
- Passport Photos
- EAMCET Rank Card

### Fee Structures
- CSE, AI-ML, DS: ₹85,000
- IT: ₹80,000
- ECE, EEE: ₹75,000
- MECH, CIVIL: ₹70,000

## 🛠️ Available Commands

```bash
# Check database connection
npm run db:check

# Run migrations only
npm run db:migrate

# Complete setup (migrations + seed)
npm run db:setup

# Reset database (⚠️ DELETES ALL DATA)
npm run db:reset

# Reset and setup fresh
npm run db:reset && npm run db:setup
```

## 🧪 Verify Installation

After setup, run some queries to verify:

```bash
psql ams_db

-- Check roles
SELECT * FROM roles;

-- Check users
SELECT u.username, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.id;

-- Check courses
SELECT * FROM courses;

-- Exit
\q
```

## 🚨 Troubleshooting

### Connection Refused
**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql@16

# Or check if it's running
ps aux | grep postgres
```

### Database Does Not Exist
**Error:** `database "ams_db" does not exist`

**Solution:**
```bash
createdb ams_db
```

### Permission Denied
**Error:** `permission denied for schema public`

**Solution:**
```bash
psql ams_db
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
\q
```

### Password Authentication Failed
**Error:** `password authentication failed`

**Solution:**
1. Check your PostgreSQL password
2. Update `.env.local` with correct credentials
3. Or set no password for local dev:
   ```bash
   # Edit pg_hba.conf
   # Change 'md5' to 'trust' for local connections
   ```

## 📊 Next Steps

After successful database setup:

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Review Database Schema**
   - Check `database/README.md` for detailed schema documentation
   - See `database/queries.sql` for useful queries

3. **Build APIs**
   - Create Next.js API routes using the database connection
   - Use `database/db.ts` for queries

4. **Test with Sample Data**
   - Login with default users
   - Create test students
   - Record documents and fees

## 🔐 Security Reminder

**Before production:**
- [ ] Change all default passwords
- [ ] Use secure password hashing (bcrypt)
- [ ] Set up proper environment variables
- [ ] Enable SSL connections
- [ ] Configure proper database user permissions
- [ ] Set up regular backups

---

## 📖 Additional Resources

- **Database Schema:** `database/README.md`
- **Sample Queries:** `database/queries.sql`
- **Migration Files:** `database/migrations/`
- **Scripts:** `database/scripts/`

---

**Need Help?** Check the troubleshooting section or review the PostgreSQL logs.
