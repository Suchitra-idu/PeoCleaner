// Updated services with prices
export const mockServices = [
  { id: 1, name: "Deep Cleaning", price: 150 },
  { id: 2, name: "Carpet Cleaning", price: 80 },
  { id: 3, name: "Window Cleaning", price: 50 },
  { id: 4, name: "Post-Construction Cleaning", price: 250 },
  { id: 5, name: "Move-in/Move-out Cleaning", price: 200 },
];

// Updated mock bookings to have an array of services and include status (from admin refactor)
export const mockBookings = [
  {
    id: 1,
    customer_name: "John Doe",
    address: { no: "123", street: "Main St", city: "Anytown" },
    // Changed service_id to services array
    services: [
      { service_id: 1, quantity: 1 },
      { service_id: 3, quantity: 1 },
    ],
    date_time: "2025-05-01T10:00",
    service_id: null, // Deprecated single service_id
    user_id: 1,
    status: "Completed", // Added status
  },
  {
    id: 2,
    customer_name: "Jane Smith",
    address: { no: "456", street: "Oak Ave", city: "Somecity" },
    services: [{ service_id: 2, quantity: 1 }], // Multiple services
    date_time: "2025-05-03T14:30",
    service_id: null, // Deprecated single service_id
    user_id: 1,
    status: "Confirmed", // Added status
  },
];

// Updated mock user profile with mobile and email
export const mockUserProfile = {
  user_id: 1,
  default_name: "John Smith",
  default_address: { no: "789", street: "Oak Rd", city: "Usercity" },
  mobile: "123-456-7890", // New field
  email: "john.smith@example.com", // New field
};

// New: Mock available time slots from the server
export const mockAvailableSlots = [
  { id: 101, dateTime: "2025-06-01T09:00", slotsAvailable: 2 },
  { id: 102, dateTime: "2025-06-01T13:00", slotsAvailable: 1 },
  { id: 103, dateTime: "2025-06-02T10:00", slotsAvailable: 3 },
  { id: 104, dateTime: "2025-06-03T14:00", slotsAvailable: 0 }, // Example of unavailable slot
  { id: 105, dateTime: "2025-06-04T09:30", slotsAvailable: 1 },
];

// Reuse booking statuses from admin definition
export const bookingStatuses = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];
