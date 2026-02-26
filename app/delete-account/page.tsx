"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function DeleteAccountPage() {
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';
  const supportEmail = "support@brokenomore.in";
  const developerName = "Kushagra & Vruddhi";

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Account Deletion – BNM (Broke No More)</h1>
        
        {/* Header Information */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg">
          <p className="text-gray-700 mb-3 text-lg">
            <strong>BNM (Broke No More)</strong> is a personal finance management application published by <strong>{developerName}</strong>.
          </p>
          <p className="text-gray-700 text-lg">
            Users can request deletion of their BNM account and associated personal data at any time.
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700 mt-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How to Request Account Deletion</h2>
            <p className="mb-4">To delete your BNM account, you can use one of the following methods:</p>
            
            <div className="space-y-4 my-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Method 1: From the App</h3>
                <ol className="list-decimal list-inside ml-2 space-y-1 text-gray-700">
                  <li>Log in to the BNM app</li>
                  <li>Go to <strong>Profile → Settings → Delete Account</strong></li>
                </ol>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Method 2: Via Email</h3>
                <p className="mb-2 text-gray-700">
                  Email us at{" "}
                  <a 
                    href={`mailto:${supportEmail}?subject=Account Deletion Request – BNM`}
                    className="text-[#6B46C1] hover:underline font-semibold"
                  >
                    {supportEmail}
                  </a>{" "}
                  from your registered email address with the subject <strong>&quot;Account Deletion Request – BNM&quot;</strong>.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Will Be Deleted</h2>
            <p className="mb-4">Once verified, we will permanently delete:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>User account information</li>
              <li>Stored personal data</li>
              <li>App-related records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Retention</h2>
            <p className="mb-4">
              Some data may be retained for legal or compliance purposes, if required by law.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
              <p className="font-semibold text-gray-900">
                We do <strong>not</strong> retain or sell any user data for marketing or advertising purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact</h2>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
              <p className="mb-2">
                <strong>Email:</strong>{" "}
                <a 
                  href={`mailto:${supportEmail}`}
                  className="text-[#6B46C1] hover:underline font-semibold"
                >
                  {supportEmail}
                </a>
              </p>
              <p className="text-sm text-gray-600">
                For account deletion requests or any questions regarding your data, please contact us at the email above.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="text-[#6B46C1] hover:underline font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

