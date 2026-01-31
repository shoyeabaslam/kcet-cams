# Database Setup Guide

## Prerequisites

1. **PostgreSQL** installed and running (v14 or higher recommended)
2. **Node.js** v18+ with npm

## Quick Start

### 1. Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE ams_db;
\q

# Or using createdb command
createdb -U postgres ams_db
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update with your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ams_db

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ams_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Run Complete Setup

This single command will:
- Check database connection
- Run all migrations
- Seed initial data

```bash
npm run db:setup
```

## Available Scripts

### Check Connection
Test database connectivity:
```bash
npm run db:check
```

### Run Migrations
Execute pending migrations:
```bash
npm run db:migrate
```

### Reset Database
**⚠️ WARNING: Deletes all data**
```bash
npm run db:reset
```

### Complete Setup
Full setup (migrations + seed):
```bash
npm run db:setup
```

## Database Schema Overview

### Core Tables

#### 1. **roles** & **users**
- System roles (SuperAdmin, Admin, AdmissionStaff, DocumentOfficer, AccountsOfficer, Principal, Director)
- User authentication and role assignment

#### 2. **academic_years**, **courses**, **course_offerings**
- Academic year management (e.g., 2025-2026)
- Course definitions (CSE, ECE, MECH, etc.)
- Course offerings per academic year with intake capacity

#### 3. **fee_structures**
- Fee configuration per course offering
- Supports partial payments

#### 4. **students**
- Main student admission records
- Automatic status tracking
- Linked to course offerings and academic years

#### 5. **document_types** & **student_documents**
- Declarative document tracking (no file storage)
- Required documents: SSC, Intermediate, TC, etc.

#### 6. **fee_payments** & **student_fee_summary**
- Fee payment records (immutable)
- Aggregated fee summary per student

#### 7. **audit_logs** & **status_history**
- Complete audit trail
- Student status change history

## Student Status Flow

```
APPLICATION_ENTERED (initial)
         ↓
DOCUMENTS_DECLARED / DOCUMENTS_INCOMPLETE
         ↓
FEE_PENDING → FEE_PARTIAL → FEE_RECEIVED
         ↓
ADMITTED (final)
```

Status updates are **automatic** based on:
- Document completeness
- Fee payment status

## Default Users (Development Only)

All users have default password: `password123`

| Email | Role | Access |
|-------|------|--------|
| superadmin@college.edu | SuperAdmin | Full system access |
| admin@college.edu | Admin | User & master data management |
| admission@college.edu | AdmissionStaff | Student profile management |
| documents@college.edu | DocumentOfficer | Document declaration |
| accounts@college.edu | AccountsOfficer | Fee recording |
| principal@college.edu | Principal | Read-only monitoring |
| director@college.edu | Director | Read-only oversight |

**⚠️ Change these passwords in production!**

## Seed Data Included

- **7 Roles** (all V1 roles)
- **7 Default Users** (for development)
- **8 Courses** (CSE, ECE, EEE, MECH, CIVIL, IT, AI-ML, DS)
- **10 Document Types** (SSC, Intermediate, TC, etc.)
- **1 Academic Year** (2025-2026)
- **8 Course Offerings** (all courses for 2025-2026)
- **Fee Structures** (₹70,000 - ₹85,000 based on course)

## Migrations

### Migration Files

1. **001_initial_schema.sql**
   - Creates all core tables
   - Defines relationships and constraints
   - Adds indexes for performance

2. **002_triggers_functions.sql**
   - Automatic document status updates
   - Automatic fee status calculation
   - Status change logging
   - Audit trail creation
   - Timestamp updates

3. **003_seed_data.sql**
   - Inserts default roles
   - Creates default users
   - Adds document types
   - Sets up academic year and courses
   - Configures fee structures

### Adding New Migrations

Create new migration files with naming convention:
```
00X_description.sql
```

Example:
```sql
-- 004_add_student_preferences.sql
CREATE TABLE student_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  preference_key VARCHAR(100),
  preference_value TEXT
);
```

Then run:
```bash
npm run db:migrate
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running
```bash
# macOS with Homebrew
brew services start postgresql@14

# Check status
brew services list
```

### Authentication Failed
```
Error: password authentication failed
```
**Solution:** Verify credentials in `.env.local`

### Database Does Not Exist
```
Error: database "ams_db" does not exist
```
**Solution:** Create the database first
```bash
createdb -U postgres ams_db
```

### Permission Denied
```
Error: permission denied for schema public
```
**Solution:** Grant permissions to your user
```sql
GRANT ALL PRIVILEGES ON DATABASE ams_db TO your_user;
GRANT ALL ON SCHEMA public TO your_user;
```

## Production Deployment

### 1. Secure Environment Variables
Never commit `.env.local` to git. Use secure secret management.

### 2. Change Default Passwords
Update all default user passwords immediately.

### 3. Use Connection Pooling
Consider using connection pooling (PgBouncer) for production.

### 4. Backup Strategy
Set up regular automated backups:
```bash
pg_dump -U postgres ams_db > backup_$(date +%Y%m%d).sql
```

### 5. Monitor Performance
- Add query monitoring
- Review slow query logs
- Optimize indexes as needed

## Schema Version Control

All schema changes are tracked in `schema_migrations` table:

```sql
SELECT * FROM schema_migrations ORDER BY executed_at DESC;
```

## Support

For issues or questions:
1. Check this README
2. Review migration files for schema details
3. Check PostgreSQL logs: `tail -f /usr/local/var/log/postgres.log`
