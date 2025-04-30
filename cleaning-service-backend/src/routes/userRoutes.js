import express from "express";
import asyncHandler from "express-async-handler";
import { initializeDatabase } from "../db/database.js";

const router = express.Router();

const getDb = async () => await initializeDatabase();

// GET /api/services - Get all services
router.get(
  "/services",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const services = await db.all("SELECT * FROM services");
    res.json(services);
  })
);

// GET /api/bookings?userId=<id> - Get bookings for a specific user where it is not cancelled
router.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const userId = req.query.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId query parameter is required" });
    }

    const bookings = await db.all(
      'SELECT * FROM bookings WHERE user_id = ? AND status != "Cancelled" ORDER BY datetime DESC',
      userId
    );

    for (const booking of bookings) {
      booking.services = await db.all(
        "SELECT service_id, quantity FROM bookings_services WHERE booking_id = ?",
        booking.id
      );
      booking.address = {
        no: booking.address_no,
        street: booking.address_street,
        city: booking.address_city,
      };
      delete booking.address_no;
      delete booking.address_street;
      delete booking.address_city;
      booking.date_time = booking.datetime;
      delete booking.datetime;
    }

    res.json(bookings);
  })
);

// Calculate availability of dates based on bookings. (If a booking for that time and date exist, that time wont be sent to frontend)
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const db = await getDb();

    //Define the date range
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    //Convert them into Iso
    const startDateIso = now.toISOString();
    const endDateIso = endDate.toISOString();

    // Define potential slots
    const potentialSlots = [];
    const tempDate = new Date(now);

    // Create potential slots (all hours between 9 - 4 are potential slots)
    for (let i = 0; i < 8; i++) {
      const date = new Date(tempDate);

      for (let hour = 9; hour <= 15; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);

        if (slotTime > new Date()) {
          potentialSlots.push({
            id: Date.parse(slotTime),
            dateTime: slotTime.toISOString(),
            slotsAvailable: 1,
          });
        }
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Fetch only the datetime of existing uncancelled bookings within the window
    const existingBookings = await db.all(
      `SELECT datetime FROM bookings 
      WHERE datetime BETWEEN ? AND ? 
      AND status != "Cancelled"`,
      startDateIso,
      endDateIso
    );

    // Create a Set of booked datetimes
    const bookedDatetimes = new Set(
      existingBookings.map((booking) => booking.datetime)
    );

    //  find available ones
    const availableSlots = potentialSlots.filter(
      (slot) => !bookedDatetimes.has(slot.dateTime)
    );
    res.json(availableSlots);
  })
);

// POST /api/bookings - Create a new booking
router.post(
  "/bookings",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    //  services as [{service_id, quantity}], dateTime as ISO string
    const { userId, customer_name, address, services, date_time } = req.body;

    //Validation
    if (!userId || !customer_name || !address || !services || !date_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res
        .status(400)
        .json({ message: "Services must be a non-empty array" });
    }
    if (!address.no || !address.street || !address.city) {
      return res
        .status(400)
        .json({ message: "Address must contain no, street, and city" });
    }
    const bookingTime = new Date(date_time);
    if (!bookingTime || bookingTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or past date/time selected" });
    }

    // Check for duplicate booking
    const existingBooking = await db.get(
      "SELECT 1 FROM bookings WHERE user_id = ? AND datetime = ?",
      userId,
      date_time
    );
    if (existingBooking) {
      return res
        .status(409)
        .json({ message: "Booking already exists for this user at this time" });
    }

    //Instert the new booking
    await db.run("BEGIN TRANSACTION");
    try {
      const bookingResult = await db.run(
        "INSERT INTO bookings (user_id, customer_name, address_no, address_street, address_city, datetime) VALUES (?, ?, ?, ?, ?, ?)",
        userId,
        customer_name,
        address.no,
        address.street,
        address.city,
        date_time
      );
      const bookingId = bookingResult.lastID;

      // Insert into bookings_services table
      const bookingServiceStmt = await db.prepare(
        "INSERT INTO bookings_services (booking_id, service_id, quantity) VALUES (?, ?, ?)"
      );
      for (const service of services) {
        if (
          !service.service_id ||
          typeof service.service_id !== "number" ||
          service.service_id <= 0
        ) {
          // Check if an invalid service id has been sent from the frontend
          await db.run("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Invalid service ID in services array" });
        }
        await bookingServiceStmt.run(
          bookingId,
          service.service_id,
          service.quantity || 1
        );
      }
      await bookingServiceStmt.finalize();

      await db.run("COMMIT");

      // Fetch the newly created booking to return
      const newBooking = await db.get(
        "SELECT * FROM bookings WHERE id = ?",
        bookingId
      );
      newBooking.services = await db.all(
        "SELECT service_id, quantity FROM bookings_services WHERE booking_id = ?",
        bookingId
      );
      newBooking.address = {
        no: newBooking.address_no,
        street: newBooking.address_street,
        city: newBooking.address_city,
      };
      newBooking.date_time = newBooking.datetime;
      delete newBooking.address_no;
      delete newBooking.address_street;
      delete newBooking.address_city;
      delete newBooking.datetime;

      res.status(201).json(newBooking);
    } catch (error) {
      await db.run("ROLLBACK");
      console.error("Error creating booking:", error);
      res
        .status(500)
        .json({ message: "Failed to create booking", error: error.message });
    }
  })
);

// PUT /api/bookings/:id - Update an existing booking
router.put(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const bookingId = req.params.id;
    // services as [{service_id, quantity}], dateTime as ISO string
    const { userId, customer_name, address, services, date_time } = req.body;

    if (!userId || !customer_name || !address || !services || !date_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res
        .status(400)
        .json({ message: "Services must be a non-empty array" });
    }
    if (!address.no || !address.street || !address.city) {
      return res
        .status(400)
        .json({ message: "Address must contain no, street, and city" });
    }
    const bookingTime = new Date(date_time);
    if (!bookingTime || bookingTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or past date/time selected" });
    }

    // Ensure the booking being edited already exists.
    const existingBooking = await db.get(
      "SELECT * FROM bookings WHERE id = ?",
      bookingId
    );
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await db.run("BEGIN TRANSACTION");
    try {
      // Update booking main fields
      await db.run(
        "UPDATE bookings SET customer_name = ?, address_no = ?,address_street = ?, address_city = ?, datetime = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        customer_name,
        address.no,
        address.street,
        address.city,
        date_time,
        bookingId
      );

      // Update bookings_services
      await db.run(
        "DELETE FROM bookings_services WHERE booking_id = ?",
        bookingId
      );
      const bookingServiceStmt = await db.prepare(
        "INSERT INTO bookings_services (booking_id, service_id, quantity) VALUES (?, ?, ?)"
      );
      for (const service of services) {
        if (
          !service.service_id ||
          typeof service.service_id !== "number" ||
          service.service_id <= 0
        ) {
          await db.run("ROLLBACK");
          return res
            .status(400)
            .json({ message: "Invalid service ID in services array" });
        }
        await bookingServiceStmt.run(
          bookingId,
          service.service_id,
          service.quantity || 1
        );
      }
      await bookingServiceStmt.finalize();

      await db.run("COMMIT");

      // Fetch the updated booking to return
      const updatedBooking = await db.get(
        "SELECT * FROM bookings WHERE id = ?",
        bookingId
      );
      updatedBooking.services = await db.all(
        "SELECT service_id, quantity FROM bookings_services WHERE booking_id = ?",
        bookingId
      );
      updatedBooking.address = {
        no: updatedBooking.address_no,
        street: updatedBooking.address_street,
        city: updatedBooking.address_city,
      };
      updatedBooking.date_time = updatedBooking.datetime;
      delete updatedBooking.address_no;
      delete updatedBooking.address_street;
      delete updatedBooking.address_city;
      delete updatedBooking.datetime;

      res.json(updatedBooking);
    } catch (error) {
      await db.run("ROLLBACK");
      console.error(`Error updating booking ${bookingId}:`, error);
      res
        .status(500)
        .json({ message: "Failed to update booking", error: error.message });
    }
  })
);
// DELETE /api/bookings/:id - Delete a booking
router.delete(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const bookingId = req.params.id;

    try {
      const result = await db.run(
        "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        "Cancelled", // Set status to Cancelled
        bookingId
      );

      if (result.changes > 0) {
        // Fetch the updated booking to return to the frontend
        const updatedBooking = await db.get(
          "SELECT * FROM bookings WHERE id = ?",
          bookingId
        );
        // Re-attach related data/format as needed by the frontend (address, services, datetime)
        updatedBooking.services = await db.all(
          "SELECT service_id, quantity FROM bookings_services WHERE booking_id = ?",
          bookingId
        );
        updatedBooking.address = {
          no: updatedBooking.address_no,
          street: updatedBooking.address_street,
          city: updatedBooking.address_city,
        };
        updatedBooking.date_time = updatedBooking.datetime;
        delete updatedBooking.address_no;
        delete updatedBooking.address_street;
        delete updatedBooking.address_city;
        delete updatedBooking.datetime;

        // Respond with success
        res.json({
          message: "Booking cancelled successfully",
          id: bookingId,
          updatedBooking: updatedBooking,
        });
      } else {
        res.status(404).json({ message: "Booking not found" });
      }
    } catch (error) {
      console.error(`Error cancelling booking ${bookingId}:`, error);
      res
        .status(500)
        .json({ message: "Failed to cancel booking", error: error.message });
    }
  })
);

// GET /api/users/:userId/profile - Get user profile
router.get(
  "/users/:userId/profile",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const userId = req.params.userId;

    const profile = await db.get(
      "SELECT user_id, default_name, default_address_no, default_address_street, default_address_city, mobile, email FROM profiles WHERE user_id = ?",
      userId
    );
    // If profile is not there (A new user) Return a default structure for a new user
    if (!profile) {
      return res.json({
        user_id: parseInt(userId),
        default_name: "",
        default_address: { no: "", street: "", city: "" },
        mobile: "",
        email: "",
      });
    }

    profile.default_address = {
      no: profile.default_address_no,
      street: profile.default_address_street,
      city: profile.default_address_city,
    };
    delete profile.default_address_no;
    delete profile.default_address_street;
    delete profile.default_address_city;

    res.json(profile);
  })
);

// POST or PUT /api/users/:userId/profile - Create or update user profile
router.post(
  "/users/:userId/profile",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const userId = req.params.userId;
    const { default_name, default_address, mobile, email } = req.body;

    //Validate the data from frontend
    if (!default_name || !default_address || !mobile || !email) {
      return res.status(400).json({
        message:
          "Missing required profile fields (name, address, mobile, email)",
      });
    }
    if (
      !default_address.no ||
      !default_address.street ||
      !default_address.city
    ) {
      return res
        .status(400)
        .json({ message: "Address must contain no, street, and city" });
    }

    // Check if profile exists
    const existingProfile = await db.get(
      "SELECT 1 FROM profiles WHERE user_id = ?",
      userId
    );

    if (existingProfile) {
      // Update profile
      await db.run(
        "UPDATE profiles SET default_name = ?, default_address_no = ?, default_address_street = ?, default_address_city = ?, mobile = ?, email = ? WHERE user_id = ?",
        default_name,
        default_address.no,
        default_address.street,
        default_address.city,
        mobile,
        email,
        userId
      );
      res.json({ message: "Profile updated successfully" });
    } else {
      // Create profile
      const userExists = await db.get(
        "SELECT 1 FROM users WHERE id = ?",
        userId
      );
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }

      await db.run(
        "INSERT INTO profiles (user_id, default_name, default_address_no, default_address_street, default_address_city, mobile, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
        userId,
        default_name,
        default_address.no,
        default_address.street,
        default_address.city,
        mobile,
        email
      );
      res.status(201).json({ message: "Profile created successfully" });
    }
  })
);

export default router;
