const API_BASE_URL = "http://localhost:3000/api";

// Helper to handle fetching and error responses
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Attempt to read error message from response body
      const errorBody = await response
        .json()
        .catch(() => ({ message: "Failed to parse error response" }));
      const errorMessage =
        errorBody.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }
    // Handle 204
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
};

const API = {
  // User fetch bookings
  fetchBookings: async (userId) => {
    // console.log("API: Fetching bookings for user...", userId);
    return fetchData(`${API_BASE_URL}/bookings?userId=${userId}`);
  },

  // save booking, used for both for a new booking and updating an existing booking.
  // bookingData should include: { id?, userId, customer_name, address: {no, street, city}, services: [{service_id, quantity}], dateTime }
  saveBooking: async (bookingData) => {
    // console.log("API: Saving booking...", bookingData);
    const isUpdate = bookingData.id != null;

    // Check if its a new or an update
    const url = isUpdate
      ? `${API_BASE_URL}/bookings/${bookingData.id}`
      : `${API_BASE_URL}/bookings`;
    const method = isUpdate ? "PUT" : "POST";

    // Ensure services array format matches backend expectation
    const servicesToSave = Array.isArray(bookingData.services)
      ? bookingData.services.map((s) => ({
          service_id: parseInt(s.service_id),
          quantity: s.quantity || 1,
        }))
      : [];

    const body = {
      userId: bookingData.userId,
      customer_name: bookingData.customer_name,
      address: bookingData.address,
      services: servicesToSave,
      date_time: bookingData.date_time,
    };
    return fetchData(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },

  //  delete booking
  deleteBooking: async (bookingId) => {
    // console.log("API: Deleting booking...", bookingId);
    return fetchData(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: "DELETE",
    });
  },

  //fetch services
  fetchServices: async () => {
    // console.log("API: Fetching services...");
    return fetchData(`${API_BASE_URL}/services`);
  },

  // User fetch user profile
  fetchUserProfile: async (userId) => {
    // console.log("API: Fetching user profile...", userId);
    return fetchData(`${API_BASE_URL}/users/${userId}/profile`);
  },

  // save user profile
  // profileData should include: { default_name, default_address: {no, street, city}, mobile, email }
  saveUserProfile: async (userId, profileData) => {
    // console.log("API: Saving user profile...", userId, profileData);
    return fetchData(`${API_BASE_URL}/users/${userId}/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });
  },

  //get avilableslots
  fetchAvailableSlots: async (dateRange = {}) => {
    // console.log("API: Fetching available slots...", dateRange);
    return fetchData(`${API_BASE_URL}/availability`);
  },
};

export default API;
