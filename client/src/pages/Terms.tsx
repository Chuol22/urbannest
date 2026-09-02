export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
        <p className="text-gray-500 dark:text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using UrbanNEST, you accept and agree to be bound by the terms and provision of this agreement.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Use License</h2>
        <p className="mb-4">
          Permission is granted to temporarily use the UrbanNEST platform for personal, non-commercial transitory viewing only.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. Disclaimer</h2>
        <p className="mb-4">
          The materials on UrbanNEST are provided on an 'as is' basis. UrbanNEST makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Limitations</h2>
        <p className="mb-4">
          In no event shall UrbanNEST or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UrbanNEST's website.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Accuracy of Materials</h2>
        <p className="mb-4">
          The materials appearing on UrbanNEST could include technical, typographical, or photographic errors. UrbanNEST does not warrant that any of the materials on its website are accurate, complete or current.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Links</h2>
        <p className="mb-4">
          UrbanNEST has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by UrbanNEST of the site. Use of any such linked website is at the user's own risk.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Modifications</h2>
        <p className="mb-4">
          UrbanNEST may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Governing Law</h2>
        <p className="mb-4">
          These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            For questions about these Terms of Service, please contact us at <a href="mailto:legal@urbannest.com" className="text-amber-600 dark:text-amber-400 underline">legal@urbannest.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}