import React, { useState, useEffect } from 'react';
import { User, Save, XCircle, Phone, Mail } from 'lucide-react'; 
import Message from './Message';

/**
 * UserProfileModal component allows users to view and update their profile details.
 * It displays a modal dialog for editing default name, address, mobile number, and email,
 * with validation and smooth transition effects.
 *
 * @param {Object} props
 * @param {Object} props.userProfile - The current user profile data.
 * @param {Function} props.onSave - Callback function called with updated profile data on save.
 * @param {Function} props.onClose - Callback function to close the modal.
 * @param {boolean} props.isLoading - Whether the modal is in a loading state (for save operation).
 *
 * @returns {JSX.Element} - A modal UI to view and update the user profile.
 */
function UserProfileModal({ userProfile, onSave, onClose, isLoading }) {

  // Local state to hold form data for user profile.
  const [profileFormData, setProfileFormData] = useState({
    default_name: '',
    default_address_no: '',
    default_address_street: '',
    default_address_city: '',
    mobile: '',
    email: ''
  });


  //if modal should appear open or not.
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });


  //Effect hook to populate form data when `userProfile` changes and to trigger fade-in animation.
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        default_name: userProfile.default_name || '',
        default_address_no: userProfile.default_address?.no || '',
        default_address_street: userProfile.default_address?.street || '',
        default_address_city: userProfile.default_address?.city || '',
        mobile: userProfile.mobile || '',
        email: userProfile.email || ''
      });
    } else {
      // Reset form if no user profile is provided
      setProfileFormData({
        default_name: '',
        default_address_no: '',
        default_address_street: '',
        default_address_city: '',
        mobile: '',
        email: ''
      });
    }

    // Trigger fade-in animation after short delay
    const timer = setTimeout(() => setIsOpen(true), 50);
    return () => clearTimeout(timer);
  }, [userProfile]);

 
   //Handles change in form inputs and updates the local state accordingly.
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData({
      ...profileFormData,
      [name]: value
    });
  };

   //Validates input fields and calls `onSave` with sanitized profile data.
  const handleSaveClick = () => {
    if (
      !profileFormData.default_name.trim() ||
      !profileFormData.default_address_no.trim() ||
      !profileFormData.default_address_street.trim() ||
      !profileFormData.default_address_city.trim() ||
      !profileFormData.mobile.trim() ||
      !profileFormData.email.trim()
    ) {
      setMessage({ text: "All profile fields (Name, Address, Mobile, Email) are required.", type: 'error' });
      return;
    }

   //Performs simple email format check and presence validation.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileFormData.email.trim())) {
      setMessage({ text: "Please enter a valid email address.", type: 'error' });
      return;
    }

    const dataToSave = {
      default_name: profileFormData.default_name.trim(),
      default_address: {
        no: profileFormData.default_address_no.trim(),
        street: profileFormData.default_address_street.trim(),
        city: profileFormData.default_address_city.trim()
      },
      mobile: profileFormData.mobile.trim(),
      email: profileFormData.email.trim()
    };

    onSave(dataToSave);
  };


  // Handles closing the modal with animation before triggering `onClose`.
 
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };


   //CSS class for modal background with transition effects.
  const modalClasses = `
    fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50
    transition-opacity duration-300 ease-out
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `;

 
   //CSS class for modal content container with entrance/exit animation.

  const modalContentClasses = `
    relative bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-96 max-w-sm mx-4
    transform transition-all duration-300 ease-out
    ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
  `;


  return (
    <>

    <div className={modalClasses}>
        <div className="absolute inset-0" onClick={isLoading ? null : handleClose}></div>

        <div className={modalContentClasses} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <User className="mr-2 h-6 w-6 text-blue-600" /> Your Profile
                </h2>
                <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Close profile"
                    title="Close Profile"
                    disabled={isLoading}
                >
                    <XCircle className="h-6 w-6" />
                </button>
            </div>

            {isLoading && (
                 <div className="text-center text-blue-600 mb-4">Loading profile...</div>
            )}

            <div className="space-y-5">
              {/* Default Name */}
              <div>
                <label htmlFor="default_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Name
                </label>
                <input
                  id="default_name"
                  name="default_name"
                  type="text"
                  value={profileFormData.default_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400"
                  placeholder="Enter your default name"
                  disabled={isLoading}
                />
              </div>

              {/* Default Address */}
              <div>
                 <span className="block text-sm font-medium text-gray-700 mb-2">Default Address</span>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="default_address_no" className="block text-xs font-medium text-gray-500 mb-1">Number</label>
                        <input id="default_address_no" name="default_address_no" type="text" value={profileFormData.default_address_no} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400 text-sm" placeholder="Apt/House No." disabled={isLoading} />
                     </div>
                     <div className="md:col-span-2">
                         <label htmlFor="default_address_street" className="block text-xs font-medium text-gray-500 mb-1">Street</label>
                         <input id="default_address_street" name="default_address_street" type="text" value={profileFormData.default_address_street} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400 text-sm" placeholder="Street Name" disabled={isLoading} />
                     </div>
                     <div>
                         <label htmlFor="default_address_city" className="block text-xs font-medium text-gray-500 mb-1">City</label>
                         <input id="default_address_city" name="default_address_city" type="text" value={profileFormData.default_address_city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400 text-sm" placeholder="City" disabled={isLoading} />
                     </div>
                 </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                   <Phone className="mr-2 h-4 w-4 text-gray-500"/> Mobile Number
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel" 
                  value={profileFormData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400"
                  placeholder="e.g., 123-456-7890"
                  disabled={isLoading}
                />
              </div>

               {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                   <Mail className="mr-2 h-4 w-4 text-gray-500"/> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileFormData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 hover:border-gray-400"
                  placeholder="e.g., you@example.com"
                  disabled={isLoading}
                />
              </div>


            </div> 


            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveClick}
                className={`flex items-center px-6 py-3 rounded-md text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600'}`}
                disabled={isLoading}
              >
                 {isLoading ? 'Saving...' : <><Save className="mr-2 h-5 w-5" /> Save Profile</>}
              </button>
            </div>
          </div>
        </div>


        {message.text && (
      <Message
        type={message.type}
        text={message.text}
        duration={4000}
        onClose={() => setMessage({ text: '', type: '' })}
      />
    )}
        </>
  );
}

export default UserProfileModal;