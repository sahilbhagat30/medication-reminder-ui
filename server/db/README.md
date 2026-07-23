# Database Documentation

This directory contains the PostgreSQL schema and seeding logic.

- `pool.js`: Sets up the shared `pg` connection pool used by the API routes.
- `schema.sql`: The complete database schema (tables, constraints, indexes).
- `seed.sql`: Realistic mock data for the 5 UI dashboards.
- `generate-sql.mjs`: Script to regenerate `seed.sql` programmatically.

In a production environment, you would use a migration tool (e.g., Flyway, Prisma, Sequelize CLI) instead of a raw `schema.sql`.
