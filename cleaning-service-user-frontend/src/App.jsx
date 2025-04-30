import { useState, useEffect } from 'react';
import { Calendar, Home } from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import BookingForm from './components/BookingForm';
import UserProfileModal from './components/UserProfileModal';

import API from './api/api';
import { isFutureDateTime, validateAddress, calculateBookingPrice } from './utils/helpers'; 


export default function CleaningServiceApp() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]); // New state for available slots
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingBooking, setEditingBooking] = useState(null);

  // formData now only handles manual text inputs (name, address parts)
  // Services and Slot selection are handled by local state in BookingForm and passed up
  const [formData, setFormData] = useState({
    customer_name: '',
    address_no: '',
    address_street: '',
    address_city: '',
    // date_time and service_id are no longer in formData
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentUserId] = useState(1); // Mock current user ID


  // --- Initial Data Fetch ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Fetch all necessary data initially
        const [fetchedBookings, fetchedServices, fetchedProfile, fetchedSlots] = await Promise.all([
          API.fetchBookings(currentUserId), // Fetch bookings for the current user
          API.fetchServices(),
          API.fetchUserProfile(currentUserId),
          API.fetchAvailableSlots() // Fetch available slots
        ]);
        setBookings(fetchedBookings);
        setServices(fetchedServices);
        setUserProfile(fetchedProfile);
        setAvailableSlots(fetchedSlots);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setErrorMessage("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUserId]); // Rerun if user ID changes (not applicable with mock user)


  // --- Handlers ---

  // Handle form input changes (only for manual text fields)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
     // Clear related validation errors
    if (name.startsWith('address_') && validationErrors.address) {
         setValidationErrors(prev => ({ ...prev, address: '' }));
    }
    if (name === 'customer_name' && validationErrors.customer_name) {
         setValidationErrors(prev => ({ ...prev, customer_name: '' }));
    }
  };


  // Function to validate form - Updated for services array and slot selection
  const validateForm = (isUsingProfileAddress, selectedServiceIds, selectedSlotId) => {
    let errors = {};

    if (!isUsingProfileAddress) {
        if (!formData.customer_name.trim()) {
            errors.customer_name = 'Customer name is required';
        }
        const addressErrors = validateAddress({
            no: formData.address_no,
            street: formData.address_street,
            city: formData.address_city,
        });
        errors = { ...errors, ...addressErrors };
    } else {
         if (!userProfile || !userProfile.default_name || !userProfile.default_address?.no || !userProfile.default_address?.street || !userProfile.default_address?.city) {
              errors.profile = 'Profile name and complete address are required when using profile.';
         }
    }

    // Validate services selection
    if (!selectedServiceIds || selectedServiceIds.length === 0) {
        errors.services = 'At least one service must be selected.';
    }

    // Validate slot selection
    if (!selectedSlotId) {
        errors.date_time = 'An available date and time slot must be selected.';
    } else {
         // Find the selected slot to perform future date validation (optional, assuming API returns future slots)
         const selectedSlot = availableSlots.find(slot => slot.id.toString() === selectedSlotId);
         if (!selectedSlot || !isFutureDateTime(selectedSlot.dateTime)) {
             // This case implies outdated slots from API or a logic error
              errors.date_time = 'Selected slot is not available or in the past.';
         }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // Handle form submission - async and uses API, updated for services array and slot
  const handleSubmit = async (isUsingProfileAddress, selectedServiceIds, selectedSlotId) => {
    if (!validateForm(isUsingProfileAddress, selectedServiceIds, selectedSlotId)) {
        console.log("Validation failed", validationErrors);
        return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
        const addressToSave = isUsingProfileAddress && userProfile?.default_address
            ? userProfile.default_address
            : {
                no: formData.address_no.trim(),
                street: formData.address_street.trim(),
                city: formData.address_city.trim(),
              };

        const customerNameToSave = isUsingProfileAddress && userProfile?.default_name
            ? userProfile.default_name.trim()
            : formData.customer_name.trim();

        // Find the selected slot details
        const selectedSlot = availableSlots.find(slot => slot.id.toString() === selectedSlotId);
        if (!selectedSlot) {
             throw new Error("Selected slot not found."); // Should be caught by validation, but defensive
        }

        // Construct the services array for the booking
        const servicesToSave = selectedServiceIds.map(id => ({
             service_id: parseInt(id),
             quantity: 1 // Assuming quantity is always 1 for this example
        }));


        const bookingToSave = editingBooking
            ? { // Editing existing booking
                ...editingBooking, // Keep existing ID, user_id, etc.
                customer_name: customerNameToSave,
                address: addressToSave,
                services: servicesToSave, // Save services array
                date_time: selectedSlot.dateTime, // Use date_time from selected slot
                service_id: null, // Deprecated single service_id
                // status is managed by admin, don't change on user edit unless needed
              }
            : { // Creating new booking
                customer_name: customerNameToSave,
                address: addressToSave,
                services: servicesToSave, // Save services array
                date_time: selectedSlot.dateTime, // Use date_time from selected slot
                 // user_id and initial status ('Pending') are set in mock API if not provided
              };

        console.log("Attempting to save booking:", bookingToSave);
        await API.saveBooking(bookingToSave);

        // After saving, refetch data for the current user
        const [updatedBookings, updatedSlots] = await Promise.all([
            API.fetchBookings(currentUserId),
            API.fetchAvailableSlots() // Refetch slots as one might have been used
        ]);
        setBookings(updatedBookings);
        setAvailableSlots(updatedSlots);


        // Reset form state
        setFormData({
          customer_name: '',
          address_no: '',
          address_street: '',
          address_city: '',
        });
        // Reset local form states managed by BookingForm effect on new booking
        // setSelectedServiceIds([]); // No need, effect handles this on view change
        // setSelectedSlotId(''); // No need, effect handles this on view change
        setValidationErrors({});
        setEditingBooking(null);
        setCurrentView('dashboard');

    } catch (error) {
        console.error("Failed to save booking:", error);
        setErrorMessage("Failed to save booking. " + (error.message || "Please try again."));
    } finally {
        setIsLoading(false);
    }
  };


  // Handle booking edit - Populate form state based on editingBooking data
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    // Populate formData for manual text inputs
    setFormData({
      customer_name: booking.customer_name,
      address_no: booking.address?.no || '',
      address_street: booking.address?.street || '',
      address_city: booking.address?.city || '',
      // date_time and service_id are no longer populated here
    });
    // BookingForm useEffect will handle populating its *local* state (selected services, slot)
    setValidationErrors({});
    setCurrentView('bookingForm');
  };

  // Handle booking delete - async and uses API
  const handleDeleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
       setIsLoading(true);
       setErrorMessage(null);
       try {
         await API.deleteBooking(id);
         // After deleting, refetch data
         const [updatedBookings, updatedSlots] = await Promise.all([
             API.fetchBookings(currentUserId),
             API.fetchAvailableSlots() // Refetch slots as one might be freed up
         ]);
         setBookings(updatedBookings);
         setAvailableSlots(updatedSlots);

       } catch (error) {
         console.error("Failed to delete booking:", error);
         setErrorMessage("Failed to delete booking. " + (error.message || "Please try again."));
       } finally {
         setIsLoading(false);
       }
    }
  };

  // Switch to new booking form
  const handleNewBooking = () => {
    setEditingBooking(null);
    // Reset formData for manual inputs
    setFormData({
      customer_name: '',
      address_no: '',
      address_street: '',
      address_city: '',
    });
    // BookingForm useEffect handles resetting its local state (services, slot)
    setValidationErrors({});
    setCurrentView('bookingForm');
  };

   // Handle cancel button on form
   const handleCancel = () => {
    setEditingBooking(null);
     // Reset formData
     setFormData({
      customer_name: '',
      address_no: '',
      address_street: '',
      address_city: '',
    });
    setValidationErrors({});
    setCurrentView('dashboard');
  };

  // --- User Profile Handlers ---
  const handleOpenProfile = () => {
      setErrorMessage(null);
      setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
      setShowProfileModal(false);
  };

  const handleSaveProfile = async (profileData) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
          const updatedProfile = await API.saveUserProfile(currentUserId, profileData);
          setUserProfile(updatedProfile);
          handleCloseProfile();
      } catch (error) {
          console.error("Failed to save profile:", error);
          setErrorMessage("Failed to save profile. " + (error.message || "Please try again."));
      } finally {
          setIsLoading(false);
      }
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        userName={userProfile?.default_name}
        onLogout={() => console.log("Logout clicked")}
        onProfileClick={handleOpenProfile}
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation Buttons */}
        {!showProfileModal && (
             <div className="flex justify-center sm:justify-between items-center gap-4 mb-8">
               <button
                 onClick={() => setCurrentView('dashboard')}
                 className={`flex items-center px-6 py-3 rounded-lg font-semibold transition duration-150 ease-in-out ${
                   currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                 } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 disabled={isLoading}
               >
                 <Home className="mr-2 h-5 w-5" />
                 Dashboard
               </button>
               <button
                 onClick={handleNewBooking}
                 className={`flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${isLoading || availableSlots.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} // Disable if no slots
                 disabled={isLoading || availableSlots.length === 0} // Disable if no slots
                 title={availableSlots.length === 0 ? "No available slots to book" : "Book a new service"} // Tooltip
               >
                 <Calendar className="mr-2 h-5 w-5" />
                 Book New Service
               </button>
             </div>
        )}

        {/* General Error Message Display */}
        {errorMessage && (
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                 <strong className="font-bold">Error!</strong>
                 <span className="block sm:inline ml-2">{errorMessage}</span>
                 <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setErrorMessage(null)}>
                     <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L6.305 5.107a1.2 1.2 0 0 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                 </span>
             </div>
        )}

        {/* Loading Overlay */}
         {isLoading && (
             <div className="fixed inset-0 bg-white bg-opacity-80 z-40 flex items-center justify-center">
                 <div className="flex items-center text-blue-600 text-lg font-semibold">
                     <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2.001-2.647z"></path>
                     </svg>
                     Loading...
                 </div>
             </div>
         )}


        {/* Conditional Rendering of Views */}
        {!showProfileModal && currentView === 'dashboard' && !isLoading && (
          <Dashboard
            bookings={bookings}
            services={services}
            onNewBookingClick={handleNewBooking}
            onEditBooking={handleEditBooking}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {!showProfileModal && currentView === 'bookingForm' && !isLoading && (
          <BookingForm
            formData={formData} // Pass manual inputs
            services={services} // Pass services for selection and price calculation
            availableSlots={availableSlots} // Pass available slots
            validationErrors={validationErrors}
            onInputChange={handleInputChange} // For manual inputs
            onSubmit={handleSubmit} // Submits with collected data from BookingForm
            onCancel={handleCancel}
            editingBooking={editingBooking}
            userProfile={userProfile}
          />
        )}

        {/* User Profile Modal */}
        {showProfileModal && (
            <UserProfileModal
                 userProfile={userProfile}
                 onSave={handleSaveProfile}
                 onClose={handleCloseProfile}
                 isLoading={isLoading}
             />
        )}
      </main>

      <Footer />
    </div>
  );
}