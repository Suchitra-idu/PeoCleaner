import React, { useState, useEffect, useMemo } from 'react'; 
import { Calendar, DollarSign, Clock } from 'lucide-react'; 
import { formatAddress, formatPrice, calculateBookingPrice, formatDate } from '../utils/helpers';
/**
 * BookingForm component allows users to book or edit a service booking.
 * It provides options for selecting services, time slots, and addresses,
 * while calculating total booking prices dynamically.
 * 
 * @param {Object} props
 * @param {Object} props.formData - The current form data (e.g., address, services, date).
 * @param {Array} props.services - List of available services that can be selected for the booking.
 * @param {Array} props.availableSlots - List of available time slots for the booking.
 * @param {Object} props.validationErrors - Validation error messages to display on the form.
 * @param {Function} props.onInputChange - Function to handle changes in form input fields (e.g., address).
 * @param {Function} props.onSubmit - Callback function triggered on form submission.
 * @param {Function} props.onCancel - Callback function triggered when the form is canceled.
 * @param {Boolean} props.editingBooking - Boolean indicating whether the form is for editing an existing booking.
 * @param {Object} props.userProfile - User's profile data, including address.
 * 
 * @returns {JSX.Element} - A form for creating or editing a booking.
 */
function BookingForm({
  formData,
  services,
  availableSlots,
  validationErrors,
  onInputChange,
  onSubmit,
  onCancel,
  editingBooking,
  userProfile
}) {

    // States to determine to use the user's profile address or not
    const [useProfileAddress, setUseProfileAddress] = useState(true);
    //Store selected services
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    //Store the selected time slot
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    // Handle initial state and populate form when editing
    useEffect(() => {
        if (editingBooking) {
            // If usesr is editing, user can change address as default
            setUseProfileAddress(false);

            // Find and select what services and time slot the user has booked before 
            if (Array.isArray(editingBooking.services)) {
                 setSelectedServiceIds(editingBooking.services.map(s => s.service_id.toString()));
            } else {
                 setSelectedServiceIds([]);
            }
            const slot = availableSlots.find(s => s.dateTime === editingBooking.date_time);
            setSelectedSlotId(slot ? slot.id.toString() : '');

        } else {
            //If its a new booking, as default, profile address is used
            setUseProfileAddress(true);
            // No services or time slots are selected
            setSelectedServiceIds([]);
            setSelectedSlotId('');
        }
    }, [editingBooking, availableSlots]);


    //Handle profile info or custom info change
    const handleUseProfileToggle = (e) => {
        setUseProfileAddress(e.target.checked);
    };

    // Handle service checkbox change
    const handleServiceChange = (e) => {
        const serviceId = e.target.value;
        const isChecked = e.target.checked;

        // If user select or unselect a service
        if (isChecked) {
            // Add the service ID to the list
            setSelectedServiceIds(prevIds => {
                return [...prevIds, serviceId];
            });
        } else {
            // Remove the service ID from the list
            setSelectedServiceIds(prevIds => {
                return prevIds.filter(id => id !== serviceId);
            });
        }
        
        // if (validationErrors.services) {

        // }
    };

    // Handle tiee slot click
    const handleSlotClick = (slotId) => {
        setSelectedSlotId(slotId.toString());
        // // Clear validation error for date_time when changed
        // if (validationErrors.date_time) {
        //      // Let parent handle full validation on submit
        // }
    };


    //Disables the address fields if using the profile address and not editing.
    const areAddressFieldsDisabled = useProfileAddress && !editingBooking;

    // Calculate price dynamically based on selected services
    const selectedBookingServices = selectedServiceIds.map(id => ({ service_id: parseInt(id), quantity: 1 }));
    const totalPrice = calculateBookingPrice(selectedBookingServices, services);

    // Groups the time slots by date so they can be displayed in a user friendly manner
    const slotsGroupedByDate = useMemo(() => {
        const groups = {};
        availableSlots.forEach(slot => {
          const dateKey = slot.dateTime.split('T')[0];
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(slot);
        });
      
        // Sort and convert the object into an array
        return Object.entries(groups).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
      }, [availableSlots]);
      

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-200">
        {editingBooking ? 'Edit Booking' : 'Book a Cleaning Service'}
      </h2>

      <div className="space-y-6">

        {/* Toggle for Profile Address */}
        {!editingBooking && userProfile && (
            <div className="flex items-start">
                <input id="useProfileAddress" type="checkbox" checked={useProfileAddress} onChange={handleUseProfileToggle} className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="useProfileAddress" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                    Use my profile name and address:
                    {userProfile.default_name && userProfile.default_address ? (
                         <span className="block text-gray-600 font-medium mt-0.5">
                             {userProfile.default_name}, {formatAddress(userProfile.default_address)}
                         </span>
                    ) : (
                        <span className="block text-red-500 font-medium mt-0.5">Profile incomplete. Manual entry required.</span>
                    )}
                </label>
            </div>
        )}
         {!editingBooking && userProfile && (!userProfile.default_name || !userProfile.default_address?.no || !userProfile.default_address?.street || !userProfile.default_address?.city) && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                  Your profile is incomplete. Please enter the booking details manually.
              </div>
         )}


        {/* Customer Name */}
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input id="customer_name" name="customer_name" type="text" value={(areAddressFieldsDisabled && userProfile) ? userProfile.default_name : formData.customer_name} onChange={onInputChange} className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ validationErrors.customer_name ? 'border-red-500' : 'border-gray-300' } ${areAddressFieldsDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}`} placeholder="Enter customer name" disabled={areAddressFieldsDisabled} />
          {!areAddressFieldsDisabled && validationErrors.customer_name && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.customer_name}</p>
          )}
        </div>

        {/* Address with 3 separate inputs */}
        <div>
           <span className="block text-sm font-medium text-gray-700 mb-2">Service Address</span>
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
               <div>
                  <label htmlFor="address_no" className="block text-xs font-medium text-gray-500 mb-1">Number</label>
                  <input id="address_no" name="address_no" type="text" value={(areAddressFieldsDisabled && userProfile) ? userProfile.default_address?.no || '' : formData.address_no} onChange={onInputChange} className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ validationErrors.address_no ? 'border-red-500' : 'border-gray-300' } ${areAddressFieldsDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'} text-sm`} placeholder="Apt/House No." disabled={areAddressFieldsDisabled} />
                   {!areAddressFieldsDisabled && validationErrors.address_no && ( <p className="mt-1 text-sm text-red-500">{validationErrors.address_no}</p> )}
               </div>
               <div className="sm:col-span-2">
                   <label htmlFor="address_street" className="block text-xs font-medium text-gray-500 mb-1">Street</label>
                   <input id="address_street" name="address_street" type="text" value={(areAddressFieldsDisabled && userProfile) ? userProfile.default_address?.street || '' : formData.address_street} onChange={onInputChange} className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ validationErrors.address_street ? 'border-red-500' : 'border-gray-300' } ${areAddressFieldsDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'} text-sm`} placeholder="Street Name" disabled={areAddressFieldsDisabled} />
                    {!areAddressFieldsDisabled && validationErrors.address_street && ( <p className="mt-1 text-sm text-red-500">{validationErrors.address_street}</p> )}
               </div>
               <div>
                   <label htmlFor="address_city" className="block text-xs font-medium text-gray-500 mb-1">City</label>
                   <input id="address_city" name="address_city" type="text" value={(areAddressFieldsDisabled && userProfile) ? userProfile.default_address?.city || '' : formData.address_city} onChange={onInputChange} className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ validationErrors.address_city ? 'border-red-500' : 'border-gray-300' } ${areAddressFieldsDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'} text-sm`} placeholder="City" disabled={areAddressFieldsDisabled} />
                    {!areAddressFieldsDisabled && validationErrors.address_city && ( <p className="mt-1 text-sm text-red-500">{validationErrors.address_city}</p> )}
               </div>
           </div>
           {validationErrors.address && ( <p className="mt-1 text-sm text-red-500">{validationErrors.address}</p> )}
            {useProfileAddress && !editingBooking && userProfile && (
                 <p className="mt-2 text-sm text-gray-500">Using profile address: {userProfile.default_address ? formatAddress(userProfile.default_address) : 'N/A'}</p>
            )}
        </div>


        {/* Select service type*/}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Select Service(s)
           </label>
           <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${validationErrors.services ? 'border border-red-500 p-3 rounded' : ''}`}>
               {services.map(service => (
                   <div key={service.id} className="flex items-center">
                       <input
                           id={`service-${service.id}`}
                           type="checkbox"
                           value={service.id}
                           checked={selectedServiceIds.includes(service.id.toString())}
                           onChange={handleServiceChange}
                           className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                       />
                       <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-900 cursor-pointer">
                           {service.name} ({formatPrice(service.price)})
                       </label>
                   </div>
               ))}
           </div>
            {validationErrors.services && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.services}</p>
            )}
        </div>

        {/* Select time slot */}
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-gray-600" /> Select a Date
        </label>

        {/*  Show available dates */}
        <div className="flex flex-wrap gap-3 mb-4">
            {slotsGroupedByDate.map(([dateKey]) => (
            <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`
                px-4 py-2 border rounded-md text-sm font-medium transition duration-150 ease-in-out
                ${selectedDate === dateKey
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}
                `}
            >
                {formatDate(dateKey).split(', ')[0]} {/* Display "Monday", "Tuesday", etc. */}
            </button>
            ))}
        </div>

        {/* Show time slots for selected date */}
        {selectedDate && slotsGroupedByDate.some(([date]) => date === selectedDate) ? (
            <div className={`space-y-2 ${validationErrors.date_time ? 'border border-red-500 p-3 rounded' : ''}`}>
            <h4 className="text-md font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
                Available Times for {formatDate(selectedDate)}
            </h4>
            <div className="flex flex-wrap gap-3">
                {slotsGroupedByDate.find(([date]) => date === selectedDate)[1].map(slot => (
                <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSlotClick(slot.id)}
                    className={`
                    px-4 py-2 border rounded-md text-sm font-medium transition duration-150 ease-in-out
                    ${selectedSlotId.toString() === slot.id.toString()
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}
                    ${slot.slotsAvailable === 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}
                    `}
                    disabled={slot.slotsAvailable === 0}
                >
                    {formatDate(slot.dateTime).split(', ')[2]} ({slot.slotsAvailable} left)
                </button>
                ))}
            </div>
            </div>
        ) : (
            selectedDate && (
            <p className="text-gray-600 p-3 border rounded-md bg-gray-50">
                No slots available for the selected date.
            </p>
            )
        )}

        {/* Validation error display */}
        {validationErrors.date_time && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.date_time}</p>
        )}
        </div>



        {/* Calculated Price Display */}
        {selectedServiceIds.length > 0 && services && ( 
             <div className="flex items-center justify-end text-lg font-semibold text-gray-800 mt-4 pt-4 border-t border-gray-200">
                 <DollarSign className="mr-2 h-6 w-6 text-green-600" />
                 Total Price: <span className="ml-2 text-green-600">{formatPrice(totalPrice)}</span>
             </div>
        )}


        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
          <button onClick={onCancel} className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition duration-150 ease-in-out">
            Cancel
          </button>
          <button
             onClick={() => onSubmit(useProfileAddress, selectedServiceIds, selectedSlotId)}
             className={`w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${selectedServiceIds.length === 0 || !selectedSlotId ? 'opacity-50 cursor-not-allowed' : ''}`}
             disabled={selectedServiceIds.length === 0 || !selectedSlotId}
          >
            {editingBooking ? 'Update Booking' : 'Book Service'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;