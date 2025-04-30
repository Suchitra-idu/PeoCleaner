// Updated services with prices
export const mockServices = [
  { id: 1, name: "Deep Cleaning", price: 150 },
  { id: 2, name: "Carpet Cleaning", price: 80 },
  { id: 3, name: "Window Cleaning", price: 50 },
  { id: 4, name: "Post-Construction Cleaning", price: 250 },
  { id: 5, name: "Move-in/Move-out Cleaning", price: 200 },
];

export const mockBookings = [
  {
    id: 1,
    customer_name: "Kamal rathnayake",
    address: { no: "72/12", street: "Yatawatta street", city: "Horana" },
    services: [
      { service_id: 1, quantity: 1 },
      { service_id: 2, quantity: 1 },
    ],
    date_time: "2025-05-01T10:00",
    service_id: null,
    user_id: 1,
    status: "Completed",
  },
];

export const mockUserProfile = {
  user_id: 1,
  default_name: "Kamal rathnayake",
  default_address: { no: "72/12", street: "Yatawatta street", city: "Horana" },
  mobile: "0721231232",
  email: "Kamal@gmail.com",
};

export const bookingStatuses = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];
