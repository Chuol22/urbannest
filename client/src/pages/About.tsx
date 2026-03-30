
export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About UrbanNest</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your trusted partner in finding the perfect home or place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            At UrbanNEST, we're dedicated to helping individuals and families find their 
            perfect home or place. We believe that everyone deserves a comfortable, safe, and 
            affordable place to live. Our platform connects tenants with quality 
            properties and landlords with reliable tenants.
          </p>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
          <p className="text-gray-600 leading-relaxed">
            To revolutionize the rental market by creating a transparent, efficient, 
            and user-friendly platform that makes finding and managing rental properties 
            a seamless experience for everyone involved.
          </p>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Why Choose UrbanNEST?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-primary-600 text-4xl mb-4">✓</div>
            <h3 className="text-xl font-semibold mb-2">Verified Properties</h3>
            <p className="text-gray-600">All listings are verified for authenticity and quality</p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-primary-600 text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
            <p className="text-gray-600">Safe and secure payment processing</p>
          </div>
          
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-primary-600 text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
            <p className="text-gray-600">Dedicated customer support team</p>
          </div>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Find Your Perfect Nest?</h2>
        <p className="text-gray-600 mb-6">Join thousands of satisfied tenants who found their dream home with UrbanNEST</p>
        <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
          Start Your Search
        </button>
      </div>
    </div>
  );
}