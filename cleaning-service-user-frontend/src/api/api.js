import {
  mockBookings,
  mockServices,
  mockUserProfile,
  mockAvailableSlots,
  bookingStatuses,
} from "../data/mockData";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let currentMockBookings = [...mockBookings];
let currentMockUserProfile = { ...mockUserProfile };
let currentMockAvailableSlots = [...mockAvailableSlots]; // Mutable copy for slots

const API = {
  // --- User Booking API ---

  // User fetch bookings (already includes status in mock)
  fetchBookings: async (userId) => {
    // Added userId filter back for user app
    console.log("Mock API (User): Fetching bookings for user...", userId);
    await delay(500);
    // Filter by user_id for the user app
    return currentMockBookings.filter((b) => b.user_id === userId);
  },

  // User/Admin save booking - Updated to handle services array and calculate price
  saveBooking: async (bookingData) => {
    console.log("Mock API: Saving booking...", bookingData);
    await delay(500);

    // Ensure address is correctly structured { no, street, city }
    // Ensure services is an array of { service_id, quantity }
    const bookingToSave = {
      ...bookingData,
      address: {
        no: bookingData.address?.no || "",
        street: bookingData.address?.street || "",
        city: bookingData.address?.city || "",
      },
      services: Array.isArray(bookingData.services)
        ? bookingData.services.map((s) => ({
            service_id: parseInt(s.service_id), // Ensure ID is number
            quantity: s.quantity || 1, // Default quantity to 1
          }))
        : [], // Ensure services is an array
      // status: bookingData.status || 'Pending', // Set initial status if not provided
      // user_id: bookingData.user_id || 1, // Assume current user is ID 1 if not provided
    };

    // Set initial status if it's a new booking and status is not provided
    if (!bookingToSave.id && !bookingToSave.status) {
      bookingToSave.status = "Pending";
    }
    // Assume user ID 1 if not provided (for new mock bookings)
    if (!bookingToSave.id && !bookingToSave.user_id) {
      bookingToSave.user_id = 1;
    }

    if (bookingToSave.id) {
      // Update existing booking
      currentMockBookings = currentMockBookings.map((b) =>
        b.id === bookingToSave.id ? { ...b, ...bookingToSave } : b
      );
      console.log("Mock API: Booking updated.", bookingToSave.id);
      return bookingToSave; // Return updated booking
    } else {
      // Add new booking
      const newBooking = {
        id: Date.now(), // Simple ID generation
        ...bookingToSave,
      };
      currentMockBookings.push(newBooking);

      // Decrement slot availability (Mock logic)
      const slot = currentMockAvailableSlots.find(
        (s) => s.dateTime === newBooking.date_time
      );
      if (slot) {
        slot.slotsAvailable = Math.max(0, slot.slotsAvailable - 1); // Decrement, minimum 0
      }

      console.log("Mock API: New booking added.", newBooking.id);
      return newBooking; // Return new booking with generated ID
    }
  },

  // User/Admin delete booking - remains same
  deleteBooking: async (bookingId) => {
    console.log("Mock API: Deleting booking...", bookingId);
    await delay(300);
    const initialLength = currentMockBookings.length;
    const deletedBooking = currentMockBookings.find((b) => b.id === bookingId);
    currentMockBookings = currentMockBookings.filter((b) => b.id !== bookingId);

    // Increment slot availability if booking was successfully deleted (Mock logic)
    if (deletedBooking) {
      const slot = currentMockAvailableSlots.find(
        (s) => s.dateTime === deletedBooking.date_time
      );
      if (slot) {
        slot.slotsAvailable = slot.slotsAvailable + 1; // Increment
      }
    }

    if (currentMockBookings.length < initialLength) {
      console.log("Mock API: Booking deleted.", bookingId);
      return { success: true, id: bookingId };
    } else {
      console.log("Mock API: Booking not found for deletion.", bookingId);
      throw new Error("Booking not found");
    }
  },

  // User/Admin fetch services - Updated to include price
  fetchServices: async () => {
    console.log("Mock API: Fetching services...");
    await delay(200);
    return mockServices; // mockServices now includes price
  },

  // --- User Profile API ---

  // User fetch user profile - Updated to handle mobile/email
  fetchUserProfile: async (userId) => {
    console.log("Mock API: Fetching user profile...", userId);
    await delay(400);
    if (userId === 1) {
      // Assume user ID 1 for mock
      // Ensure default_address is structured { no, street, city }
      // Ensure mobile and email fields are present
      return {
        ...currentMockUserProfile,
        default_address: {
          no: currentMockUserProfile.default_address?.no || "",
          street: currentMockUserProfile.default_address?.street || "",
          city: currentMockUserProfile.default_address?.city || "",
        },
        mobile: currentMockUserProfile.mobile || "", // Ensure field exists
        email: currentMockUserProfile.email || "", // Ensure field exists
      };
    }
    console.log("Mock API: User profile not found for user_id", userId);
    // In a real app, you might return a default structure for a new user
    return {
      user_id: userId,
      default_name: "",
      default_address: {},
      mobile: "",
      email: "",
    };
  },

  // User save user profile - Updated to handle mobile/email
  saveUserProfile: async (userId, profileData) => {
    console.log("Mock API: Saving user profile...", userId, profileData);
    await delay(600);
    if (userId === 1) {
      // Assume user ID 1 for mock
      // Ensure data structure is correct for saving
      const profileToSave = {
        ...profileData,
        default_address: {
          no: profileData.default_address?.no || "",
          street: profileData.default_address?.street || "",
          city: profileData.default_address?.city || "",
        },
        mobile: profileData.mobile || "", // Ensure field exists
        email: profileData.email || "", // Ensure field exists
      };
      currentMockUserProfile = { ...currentMockUserProfile, ...profileToSave };
      console.log("Mock API: User profile saved.", userId);
      return currentMockUserProfile;
    }
    console.log(
      "Mock API: User profile not found for saving for user_id",
      userId
    );
    throw new Error("User profile not found for saving");
  },

  // --- Availability API ---
  fetchAvailableSlots: async (dateRange = {}) => {
    // dateRange could be { startDate, endDate }
    console.log("Mock API: Fetching available slots...", dateRange);
    await delay(400);
    // In a real app: query Supabase 'availability' table or similar
    // Filter by date range if provided
    // For mock, just return the static mock list
    // Filter out slots in the past and with 0 availability
    const now = new Date();
    return currentMockAvailableSlots
      .filter((slot) => {
        const slotDateTime = new Date(slot.dateTime);
        return (
          slotDateTime.getTime() > now.getTime() && slot.slotsAvailable > 0
        );
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)); // Sort by date/time
  },

  // --- Admin API (Keep separate or merge based on architecture) ---
  // For this example, we assume the Admin App uses a different API interface or set of functions
  // that include fetchAllBookings, fetchBookingDetails, updateBookingStatus, etc.
  // If sharing, these would also be in this file, but need to handle admin-specific logic (like no user_id filter for fetchAllBookings)
};

export default API;
