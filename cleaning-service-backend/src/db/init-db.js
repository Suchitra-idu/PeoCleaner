import { initializeDatabase } from "./database.js";
import {
  mockServices,
  mockBookings,
  mockUserProfile,
  bookingStatuses,
} from "../data/mockData.js";

async function runMigrationsAndSeedData() {
  const db = await initializeDatabase();

  console.log("Running database migrations...");
  await db.exec(`
    DROP TABLE IF EXISTS bookings_services;
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS profiles;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS services;
    DROP TABLE IF EXISTS availability;
  `);

  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE profiles (
      user_id INTEGER PRIMARY KEY,
      default_name TEXT,
      default_address_no TEXT,
      default_address_street TEXT,
      default_address_city TEXT,
      mobile TEXT,
      email TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      price REAL NOT NULL
    );

    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      address_no TEXT,
      address_street TEXT,
      address_city TEXT,
      datetime TEXT NOT NULL, -- Link to availability by matching datetime or storing availability_id
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('${bookingStatuses.join(
        "', '"
      )}')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL -- Set NULL if user deleted
      -- FOREIGN KEY (datetime) REFERENCES availability(datetime) -- Consider linking to availability table
    );

    -- Junction table for many-to-many relationship between bookings and services
    CREATE TABLE bookings_services (
      booking_id INTEGER,
      service_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      PRIMARY KEY (booking_id, service_id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );
  `);

  console.log("Tables created.");

  //Add sample data

  const serviceStmt = await db.prepare(
    "INSERT INTO services (name, price) VALUES (?, ?)"
  );
  for (const service of mockServices) {
    await serviceStmt.run(service.name, service.price);
  }
  await serviceStmt.finalize();

  const userStmt = await db.prepare(
    "INSERT INTO users (id, username, password) VALUES (?, ?, ?)"
  );
  await userStmt.run(1, "john.smith", "hashedpassword");
  await userStmt.run(2, "jane.doe", "anotherhashedpassword");
  await userStmt.finalize();

  const profileStmt = await db.prepare(
    "INSERT INTO profiles (user_id, default_name, default_address_no, default_address_street, default_address_city, mobile, email) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  await profileStmt.run(
    mockUserProfile.user_id,
    mockUserProfile.default_name,
    mockUserProfile.default_address.no,
    mockUserProfile.default_address.street,
    mockUserProfile.default_address.city,
    mockUserProfile.mobile,
    mockUserProfile.email
  );
  await profileStmt.finalize();

  for (const booking of mockBookings) {
    const bookingResult = await db.run(
      "INSERT INTO bookings (id, user_id, customer_name, address_no, address_street, address_city, datetime, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      booking.id,
      booking.user_id,
      booking.customer_name,
      booking.address.no,
      booking.address.street,
      booking.address.city,
      booking.date_time,
      booking.status || "Pending"
    );
    const bookingId = bookingResult.lastID;

    if (booking.services && Array.isArray(booking.services)) {
      const bookingServiceStmt = await db.prepare(
        "INSERT INTO bookings_services (booking_id, service_id, quantity) VALUES (?, ?, ?)"
      );
      for (const service of booking.services) {
        await bookingServiceStmt.run(
          bookingId,
          service.service_id,
          service.quantity || 1
        );
      }
      await bookingServiceStmt.finalize();
    }
  }

  await db.close();
  console.log("Database initialization complete.");
}

runMigrationsAndSeedData().catch((err) => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
