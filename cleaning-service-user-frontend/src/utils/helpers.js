/**
 * Formats a date string into a readable format (e.g., "Apr 30, 2025, 1:45 PM").
 * @param {string} dateString - A string representing a date.
 * @returns {string} Formatted date string or empty string if input is invalid.
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

/**
 * Retrieves the name of a service based on its ID.
 * @param {number|string} serviceId - The ID of the service to look up.
 * @param {Array} services - Array of service objects with `id` and `name` fields.
 * @returns {string} The name of the service or "Unknown Service" if not found.
 */
export const getServiceName = (serviceId, services) => {
  const service = services.find((s) => s.id === parseInt(serviceId));
  return service ? service.name : "Unknown Service";
};

/**
 * Formats an address object into a single comma-separated string.
 * @param {Object} address - The address object with optional `no`, `street`, and `city`.
 * @returns {string} Formatted address or "N/A" if address is missing.
 */
export const formatAddress = (address) => {
  if (!address) return "N/A";
  const parts = [];
  if (address.no) parts.push(address.no);
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  return parts.join(", ");
};

/**
 * Checks whether a given datetime string represents a time at least one minute in the future.
 * @param {string} dateTimeString - A datetime string to evaluate.
 * @returns {boolean} True if the date is in the future, false otherwise.
 */
export const isFutureDateTime = (dateTimeString) => {
  if (!dateTimeString) return false;
  const selectedDate = new Date(dateTimeString);
  const now = new Date();
  return selectedDate.getTime() > now.getTime() + 60 * 1000;
};

/**
 * Validates required parts of an address object.
 * @param {Object} addressParts - The address parts to validate.
 * @returns {Object} An object with validation error messages keyed by field name.
 */
export const validateAddress = (addressParts) => {
  const errors = {};
  if (!addressParts.no || !addressParts.no.trim())
    errors.address_no = "Number is required";
  if (!addressParts.street || !addressParts.street.trim())
    errors.address_street = "Street is required";
  if (!addressParts.city || !addressParts.city.trim())
    errors.address_city = "City is required";
  return errors;
};

/**
 * Returns Tailwind CSS classes representing the status color.
 * @param {string} status - The current status of a booking or task.
 * @returns {string} A string of CSS classes.
 */
export const getStatusColorClass = (status) => {
  switch (status) {
    case "Pending":
      return "text-yellow-700 bg-yellow-100";
    case "Confirmed":
      return "text-blue-700 bg-blue-100";
    case "In Progress":
      return "text-purple-700 bg-purple-100";
    case "Completed":
      return "text-green-700 bg-green-100";
    case "Cancelled":
      return "text-red-700 bg-red-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
};

/**
 * Calculates the total price of booked services.
 * @param {Array} bookingServices - List of services in the booking with `service_id` and `quantity`.
 * @param {Array} allServices - List of all available services with `id` and `price`.
 * @returns {number} The total price of the booking.
 */
export const calculateBookingPrice = (bookingServices, allServices) => {
  if (!bookingServices || !Array.isArray(bookingServices) || !allServices)
    return 0;

  let total = 0;
  bookingServices.forEach((bookedService) => {
    const serviceDetails = allServices.find(
      (s) => s.id === bookedService.service_id
    );
    if (serviceDetails) {
      const quantity = bookedService.quantity || 1;
      total += serviceDetails.price * quantity;
    }
  });
  return total;
};

/**
 * Formats a numeric price into a US dollar currency string.
 * @param {number|null|undefined} price - The price to format.
 * @returns {string} A formatted price string or "N/A" if input is invalid.
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
};
