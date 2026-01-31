# College Admission Management System (CAMS) - V1

> A comprehensive admission management system built for Indian engineering colleges. V1 focuses on digitizing daily admission operations with role-based access control and audit trails.

## 🎯 Project Overview

**CAMS V1** streamlines the admission process by providing:
- Digital student admission workflows
- Role-based access for staff, document officers, accounts, and management
- Automatic status tracking based on documents and fees
- Complete audit trails for compliance
- Read-only monitoring dashboards for Principal and Director

## 🏗️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI:** Shadcn/ui, Tailwind CSS
- **Database:** PostgreSQL 14+
- **ORM:** Native pg driver
- **Runtime:** Node.js 18+

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- npm or yarn package manager

### 2. Installation

```bash
# Clone and install
npm install

# Create database
createdb ams_db

# Configure environment
cp .env.example .env.local
# Edit .env.local with your PostgreSQL credentials

# Setup database (migrations + seed data)
npm run db:setup
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Database Commands

```bash
npm run db:check      # Test database connection
npm run db:migrate    # Run pending migrations
npm run db:setup      # Complete setup (migrations + seed)
npm run db:reset      # ⚠️ Delete all data and reset
```

See [SETUP.md](./SETUP.md) for detailed database setup guide.

## 👥 Default Users (Development)

All users have password: `password123`

| Email | Role | Access Level |
|-------|------|--------------|
| superadmin@college.edu | SuperAdmin | Full system access |
| admin@college.edu | Admin | User & master data management |
| admission@college.edu | AdmissionStaff | Student profile creation |
| documents@college.edu | DocumentOfficer | Document declaration |
| accounts@college.edu | AccountsOfficer | Fee recording |
| principal@college.edu | Principal | Read-only monitoring |
| director@college.edu | Director | Read-only oversight |

⚠️ **Change these in production!**

## 🎓 System Features (V1)

### In Scope
✅ Student admission data entry  
✅ Document declaration (names only, no file storage)  
✅ Fee recording (full and partial payments)  
✅ Role-based access control  
✅ Automatic status updates  
✅ Read-only monitoring dashboards  
✅ Immutable audit logs  
✅ Status change history  

### Out of Scope (V2)
❌ File uploads / document storage  
❌ Fee concessions / scholarships  
❌ Management quota workflows  
❌ Refund processing  
❌ SMS / Email notifications  
❌ Student self-service portal  

## 📊 Student Status Flow

```
APPLICATION_ENTERED
         ↓
DOCUMENTS_DECLARED / DOCUMENTS_INCOMPLETE
         ↓
FEE_PENDING → FEE_PARTIAL → FEE_RECEIVED
         ↓
ADMITTED
```

Status updates are **automatic** - no manual approvals required!

## 🗂️ Project Structure

```
ams-app/
├── database/
│   ├── db.ts                    # Database connection
│   ├── queries.sql              # Useful SQL queries
│   ├── README.md                # Database documentation
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_triggers_functions.sql
│   │   └── 003_seed_data.sql
│   └── scripts/
│       ├── check-connection.ts
│       ├── migrate.ts
│       ├── seed.ts
│       ├── reset.ts
│       └── setup.ts
├── src/
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   └── lib/                     # Utilities
└── public/                      # Static assets
```

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete database setup guide
- **[database/README.md](./database/README.md)** - Database schema documentation
- **[database/queries.sql](./database/queries.sql)** - Sample queries and reports

## 🔐 Security Notes

- All passwords hashed with bcrypt
- Role-based access control at API level
- Immutable audit logs
- No hard deletes - soft delete only
- Environment variables for sensitive data

## 🧪 Testing

```bash
# Check database connection
npm run db:check

# Verify tables created
psql ams_db -c "\dt"

# Check seed data
psql ams_db -c "SELECT * FROM roles;"
```

## 📈 Next Steps

1. Review [SETUP.md](./SETUP.md) for detailed setup
2. Explore database schema in `database/README.md`
3. Check sample queries in `database/queries.sql`
4. Start building API routes in `src/app/api/`
5. Create UI components in `src/components/`

## 🤝 Contributing

This is V1 - we focus on core admission workflows only. Any features outside the V1 scope should be labeled for V2.

## 📄 License

Private - For educational/institutional use only.

---

This is a [Next.js](https://nextjs.org) project with PostgreSQL database.
