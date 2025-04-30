import { useState, useEffect } from 'react';
import { Calendar, Home } from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import BookingForm from './components/BookingForm';
import UserProfileModal from './components/UserProfileModal';
import Message from './components/Message'; 
import Confirmation from './components/Confirmation'; 

import API from './api/api';
import { isFutureDateTime, validateAddress, calculateBookingPrice } from './utils/helpers';


export default function CleaningServiceApp() {
  // State variables
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingBooking, setEditingBooking] = useState(null);


  const [formData, setFormData] = useState({
    customer_name: '',
    address_no: '',
    address_street: '',
    address_city: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for Message component
  const [message, setMessage] = useState(null); // { text: string, type: 'success' | 'error' | 'info' | 'warning' }

  // State for Confirmation component
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null); // { id: string, title: string, message: string, onConfirm: function }

  const [currentUserId] = useState(1); // Mock current user ID


  /**
   * Effect hook to load initial data (bookings, services, profile, available slots)
   * when the component mounts or the current user ID changes.
   */
  useEffect(() => {
    /**
     * Async function to fetch all necessary data from the API.
     */
    const loadData = async () => {
      setIsLoading(true);
      setMessage(null); 
      try {
        // Fetch all necessary data initially
        const [fetchedBookings, fetchedServices, fetchedProfile, fetchedSlots] = await Promise.all([
          API.fetchBookings(currentUserId), 
          API.fetchServices(),
          API.fetchUserProfile(currentUserId),
          API.fetchAvailableSlots() 
        ]);
        setBookings(fetchedBookings);
        setServices(fetchedServices);
        setUserProfile(fetchedProfile);
        setAvailableSlots(fetchedSlots);
      } catch (error) {
        console.error("Failed to load initial data:", error);

      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUserId]); 


  /**
   * Handles changes to form input fields (manual text inputs).
   * Updates the formData state and clears relevant validation errors.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear related validation errors
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name.startsWith('address_') && validationErrors.address) {
        setValidationErrors(prev => ({ ...prev, address: '' }));
    }
    if (name === 'customer_name' && validationErrors.customer_name) {
        setValidationErrors(prev => ({ ...prev, customer_name: '' }));
    }
  };


  /**
   * Validates the booking form data.
   * Checks for required fields, address format, service selection, and slot selection.
   * @param {boolean} isUsingProfileAddress - Whether the user is using their profile address.
   * @param {string[]} selectedServiceIds - Array of selected service IDs.
   * @param {string | null} selectedSlotId - The ID of the selected time slot.
   * @returns {boolean} True if the form is valid, false otherwise.
   */
  const validateForm = (isUsingProfileAddress, selectedServiceIds, selectedSlotId) => {
    let errors = {};

    // Validate name and address based on whether profile address is used
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
        // Check if profile data required for using profile address is available
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


  /**
   * Handles the form submission for creating or updating a booking.
   * Validates the form, constructs the booking object, calls the API,
   * updates state, and navigates back to the dashboard.
   * @param {boolean} isUsingProfileAddress - Whether the user is using their profile address.
   * @param {string[]} selectedServiceIds - Array of selected service IDs.
   * @param {string | null} selectedSlotId - The ID of the selected time slot.
   * @async
   */
  const handleSubmit = async (isUsingProfileAddress, selectedServiceIds, selectedSlotId) => {
    if (!validateForm(isUsingProfileAddress, selectedServiceIds, selectedSlotId)) {
        // console.log("Validation failed", validationErrors);
        setMessage({ text: "Please fix the errors in the form.", type: 'warning' }); 
        return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
        // Determine the address to save based on user choice
        const addressToSave = isUsingProfileAddress && userProfile?.default_address
             ? userProfile.default_address
             : {
                 no: formData.address_no.trim(),
                 street: formData.address_street.trim(),
                 city: formData.address_city.trim(),
               };

        // Determine the customer name to save based on user choice
        const customerNameToSave = isUsingProfileAddress && userProfile?.default_name
             ? userProfile.default_name.trim()
             : formData.customer_name.trim();

        // Find the selected slot details
        const selectedSlot = availableSlots.find(slot => slot.id.toString() === selectedSlotId);
        if (!selectedSlot) {
             throw new Error("Selected slot not found."); 
        }

        // Services array for the booking
        const servicesToSave = selectedServiceIds.map(id => ({
             service_id: parseInt(id),
             quantity: 1 
        }));


        let bookingToSave;

        if (editingBooking) {
          // Editing an existing booking
          bookingToSave = {
            ...editingBooking,     
            userId: userProfile.user_id,          
            customer_name: customerNameToSave, 
            address: addressToSave,           
            services: servicesToSave,          
            date_time: selectedSlot.dateTime,  
            service_id: null,                 
          };
        } else {
          // Creating a new booking
          bookingToSave = {
            userId: userProfile.user_id,
            customer_name: customerNameToSave, 
            address: addressToSave,            
            services: servicesToSave,         
            date_time: selectedSlot.dateTime,  
          };
        }
        

        // console.log("Attempting to save booking:", bookingToSave);
        await API.saveBooking(bookingToSave);

        // Refetching data for the current user and available slots
        const [updatedBookings, updatedSlots] = await Promise.all([
             API.fetchBookings(currentUserId),
             API.fetchAvailableSlots() 
        ]);
        setBookings(updatedBookings);
        setAvailableSlots(updatedSlots);

        setMessage({ text: `Booking ${editingBooking ? 'updated' : 'created'} successfully!`, type: 'success' }); 
        // Reset form state
        setFormData({
          customer_name: '',
          address_no: '',
          address_street: '',
          address_city: '',
        });
        setValidationErrors({});
        setEditingBooking(null);
        setCurrentView('dashboard'); 

    } catch (error) {
        console.error("Failed to save booking:", error);
        setMessage({ text: "Failed to save booking. " + (error.message || "Please try again."), type: 'error' }); 
    } finally {
        setIsLoading(false);
    }
  };


  /**
   * Sets the application state to edit an existing booking.
   * Populates the form data and switches to the booking form view.
   * @param {Object} booking - The booking object to be edited.
   */
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setFormData({
      customer_name: booking.customer_name,
      address_no: booking.address?.no || '',
      address_street: booking.address?.street || '',
      address_city: booking.address?.city || '',
    });
    setValidationErrors({});
    setMessage(null);
    setCurrentView('bookingForm'); 
  };

  const handleDeleteBooking = (id) => {
    const handleConfirm = async () => {
      setShowConfirmation(false);
      setIsLoading(true);
      setMessage(null);
  
      try {
        await API.deleteBooking(id);
        const [updatedBookings, updatedSlots] = await Promise.all([
          API.fetchBookings(currentUserId),
          API.fetchAvailableSlots(),
        ]);
        setBookings(updatedBookings);
        setAvailableSlots(updatedSlots);
        setMessage({ text: "Booking deleted successfully!", type: 'success' });
      } catch (error) {
        console.error("Failed to delete booking:", error);
        setMessage({ text: "Failed to delete booking. " + (error.message || "Please try again."), type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
  
    setConfirmationDetails({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      onConfirm: handleConfirm,
    });
  
    setShowConfirmation(true);
  };
  

 //Handles the cancellation of booking deletion.
  const handleCancelDelete = () => {
    setShowConfirmation(false); 
    
  };
   //Switches the view to the booking form for creating a new booking.
  const handleNewBooking = () => {
    setEditingBooking(null);
    setFormData({
      customer_name: '',
      address_no: '',
      address_street: '',
      address_city: '',
    });
    setValidationErrors({});
    setMessage(null); 
    setCurrentView('bookingForm');
  };

  
    //Resets form data, clears editing state, and switches back to the dashboard.
    const handleCancel = () => {
     setEditingBooking(null);
       setFormData({
        customer_name: '',
        address_no: '',
        address_street: '',
        address_city: '',
       });
     setValidationErrors({});
     setMessage(null); 
     setCurrentView('dashboard'); 
   };

  //Opens the user profile modal.
  const handleOpenProfile = () => {
       setMessage(null); 
       setShowProfileModal(true); 
  };

  //Closes the user profile modal.
  const handleCloseProfile = () => {
       setShowProfileModal(false); 
  };

  /**
   * Handles saving the user profile data.
   * Calls the API to save the profile and updates the userProfile state.
   * @param {Object} profileData - The updated user profile data.
   * @async
   */
  const handleSaveProfile = async (profileData) => {
       setIsLoading(true);
       setMessage(null); 
       try {
           const updatedProfile = await API.saveUserProfile(currentUserId, profileData);
           handleCloseProfile(); // Close the modal on successful save
           setMessage({ text: "Profile updated successfully!", type: 'success' });


          const fetchedProfile = await API.fetchUserProfile(currentUserId);
          setUserProfile(fetchedProfile);
           
       } catch (error) {
           console.error("Failed to save profile:", error);
           setMessage({ text: "Failed to save profile. " + (error.message || "Please try again."), type: 'error' }); 
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
        {!showProfileModal  && ( 
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
                 className={`flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${isLoading || availableSlots.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                 disabled={isLoading || availableSlots.length === 0} 
                 title={availableSlots.length === 0 ? "No available slots to book" : "Book a new service"} 
               >
                 <Calendar className="mr-2 h-5 w-5" />
                 Book New Service
               </button>
             </div>
        )}

        {/* Message Display */}
        {message && (
          <Message
            text={message.text}
            type={message.type}
            onClose={() => setMessage(null)} 
          />
        )}


        {/* Loading Overlay */}
         {isLoading && (
             <div className="fixed inset-0 bg-white bg-opacity-80 z-40 flex items-center justify-center">
               <div className="flex items-center text-blue-600 text-lg font-semibold">
                    {/* Spinner Icon */}
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

        {!showProfileModal  && currentView === 'bookingForm' && !isLoading && ( 
          <BookingForm
            formData={formData} 
            services={services}
            availableSlots={availableSlots}
            validationErrors={validationErrors}
            onInputChange={handleInputChange} 
            onSubmit={handleSubmit} 
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

        {/* Confirmation Modal */}
        <Confirmation
          isVisible={showConfirmation}
          title={confirmationDetails?.title || ''}
          message={confirmationDetails?.message || ''}
          onConfirm={confirmationDetails?.onConfirm || (() => {})}
          onCancel={handleCancelDelete}
        />


      </main>

      <Footer />
    </div>
  );
}
