export const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
};

export const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(dateString);
};

export const getStatusColor = (status: string) => {
  const colors = {
    quote_requested: 'bg-orange-100 text-orange-800 border-orange-200',
    quote_sent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    booking_confirmed: 'bg-green-100 text-green-800 border-green-200',
    documents_pending: 'bg-amber-100 text-amber-800 border-amber-200',
    documents_approved: 'bg-blue-100 text-blue-800 border-blue-200',
    flight_scheduled: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    ready_for_pickup: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
    arrived: 'bg-teal-100 text-teal-800 border-teal-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    
    // Legacy support
    requested: 'bg-orange-100 text-orange-800 border-orange-200',
    docs_ok: 'bg-blue-100 text-blue-800 border-blue-200',
    booked: 'bg-green-100 text-green-800 border-green-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status as keyof typeof colors] || colors.quote_requested;
};

export const getStatusLabel = (status: string) => {
  const labels = {
    quote_requested: 'Quote Requested',
    quote_sent: 'Quote Sent',
    booking_confirmed: 'Booking Confirmed',
    documents_pending: 'Documents Pending',
    documents_approved: 'Documents Approved',
    flight_scheduled: 'Flight Scheduled',
    ready_for_pickup: 'Ready for Pickup',
    in_transit: 'In Transit',
    arrived: 'Arrived at Destination',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Legacy support
    requested: 'Quote Requested',
    docs_ok: 'Documents Approved',
    booked: 'Booking Confirmed',
    archived: 'Completed',
  };
  return labels[status as keyof typeof labels] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getStatusDescription = (status: string) => {
  const descriptions = {
    quote_requested: 'We\'ve received your shipping request and are preparing a custom quote.',
    quote_sent: 'Your personalized quote has been sent. Please review and confirm to proceed.',
    booking_confirmed: 'Great! Your booking is confirmed and deposit received. We\'ll begin preparations.',
    documents_pending: 'Please upload your pet\'s health certificates and required documents.',
    documents_approved: 'All documents verified! Your pet is cleared for travel.',
    flight_scheduled: 'Flight booked! We\'ll coordinate pickup and departure details with you.',
    ready_for_pickup: 'Your pet is ready! Our team will collect them at the scheduled time.',
    in_transit: 'Your pet is safely traveling to their destination. We\'ll update you on arrival.',
    arrived: 'Good news! Your pet has safely arrived at the destination airport.',
    delivered: 'Your pet has been delivered safely to their new home!',
    completed: 'Shipment complete! Thank you for trusting us with your pet\'s journey.',
    cancelled: 'This shipment has been cancelled.',
    
    // Legacy support
    requested: 'We\'ve received your shipping request and are preparing a custom quote.',
    docs_ok: 'All documents verified! Your pet is cleared for travel.',
    booked: 'Great! Your booking is confirmed and deposit received.',
    archived: 'Shipment complete! Thank you for trusting us with your pet\'s journey.',
  };
  return descriptions[status as keyof typeof descriptions] || 'Status update in progress.';
};