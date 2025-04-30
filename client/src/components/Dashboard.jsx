import React from 'react';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDate, getServiceName, formatAddress, getStatusColorClass, formatPrice, calculateBookingPrice } from '../utils/helpers';

function Dashboard({ bookings, services, onNewBookingClick, onEditBooking, onDeleteBooking }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 border-gray-200">Your Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg mb-6">You have no bookings yet.</p>
          <button
            onClick={onNewBookingClick}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book Your First Service
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                 {/* Updated headers */}
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service(s)</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="py-3 px-4 text-left text-xs font-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking, index) => (
                <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Display list of services */}
                  <td className="py-3 px-4 whitespace-pre-wrap text-sm text-gray-700">
                      {Array.isArray(booking.services) && booking.services.length > 0
                          ? booking.services.map((bs, i) => (
                                <div key={i}>
                                    {getServiceName(bs.service_id, services)}{bs.quantity > 1 ? ` x${bs.quantity}` : ''}
                                </div>
                            ))
                          : 'N/A'}
                  </td>
                  {/* Display calculated price */}
                   <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                       {formatPrice(calculateBookingPrice(booking.services, services))}
                   </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{booking.customer_name}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(booking.date_time)}</td>
                  <td className="py-3 px-4 whitespace-pre-wrap text-sm text-gray-700">{formatAddress(booking.address)}</td>
                   {/* Display Status with color */}
                   <td className="py-3 px-4 whitespace-nowrap">
                       <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(booking.status)}`}>
                           {booking.status}
                       </span>
                   </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700 flex items-center space-x-3">
                  <button
                    onClick={() => onEditBooking(booking)}
                    disabled={booking.status === "Completed"}
                    className={`transition duration-150 ease-in-out ${
                      booking.status === "Completed"
                        ? "text-gray-400"
                        : "text-blue-500 hover:text-blue-700"
                    }`}
                    aria-label="Edit booking"
                    title="Edit Booking"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteBooking(booking.id)}
                    disabled={booking.status === "Completed"}
                    className={`transition duration-150 ease-in-out ${
                      booking.status === "Completed"
                        ? "text-gray-400"
                        : "text-red-500 hover:text-red-700"
                    }`}
                    aria-label="Delete booking"
                    title="Delete Booking"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;