export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
        <p className="text-gray-600 mb-4">
          We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Name and contact information</li>
          <li>Email address and password</li>
          <li>Phone number</li>
          <li>Property preferences and search history</li>
          <li>Payment information (for transactions)</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
        <p className="text-gray-600 mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send you technical notices, updates, and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Communicate with you about products, services, and events</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Sharing of Information</h2>
        <p className="text-gray-600 mb-4">
          We may share your information with:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Property landlords when you express interest in a property</li>
          <li>Service providers who perform services on our behalf</li>
          <li>In response to legal requests or to prevent harm</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
        <p className="text-gray-600 mb-4">
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your Rights</h2>
        <p className="text-gray-600 mb-4">
          You have the right to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Access and update your personal information</li>
          <li>Delete your account and associated data</li>
          <li>Opt-out of marketing communications</li>
          <li>Request a copy of your data</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cookies and Tracking</h2>
        <p className="text-gray-600 mb-4">
          We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            For questions about this Privacy Policy, please contact us at privacy@urbannest.com
          </p>
        </div>
      </div>
    </div>
  );
}