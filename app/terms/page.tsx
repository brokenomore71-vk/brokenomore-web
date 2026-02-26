"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function TermsPage() {
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
        <p className="text-gray-600 mb-6">Last updated: December 29, 2024</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By downloading, installing, or using the BrokeNoMore mobile application (&quot;App&quot;), you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use the App.
            </p>
            <p className="mt-4">
              Your use of the App constitutes your acceptance of these Terms and Conditions and our Privacy Policy. We reserve the right to modify these terms 
              at any time, and such modifications will be effective immediately upon posting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">BrokeNoMore is a personal finance management application designed to help users:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Track expenses and income transactions</li>
              <li>Manage budgets and financial goals</li>
              <li>Monitor spending patterns and analytics</li>
              <li>Set up bill reminders and payment tracking</li>
              <li>Track loans and EMI schedules</li>
              <li>Split expenses with friends and family</li>
              <li>Use financial calculators (EMI, FD, SIP, PPF, Lumpsum, SWP)</li>
              <li>Analyze stocks and mutual funds</li>
              <li>Access AI-powered financial chatbot for guidance</li>
              <li>Receive personalized financial tips and insights</li>
              <li>View comprehensive financial analytics and reports</li>
            </ul>
            <p className="mt-4">
              The App provides tools and features to assist with personal financial management but does not provide financial, investment, or legal advice. 
              All calculations and recommendations are for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts and Registration</h2>
            <p className="mb-4">To use certain features of the App, you must create an account by providing accurate and complete information. You are responsible for:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your account information is current and accurate</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="mt-4">
              You must be at least 18 years old to use this App. By creating an account, you represent that you meet this age requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Use the App only for lawful purposes</li>
              <li>Provide accurate financial information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Not attempt to gain unauthorized access to the App or its systems</li>
              <li>Not interfere with or disrupt the App&apos;s functionality or servers</li>
              <li>Not use the App to transmit any malicious code, viruses, or harmful content</li>
              <li>Not attempt to reverse engineer, decompile, or extract source code from the App</li>
              <li>Not use automated systems, bots, or scripts to access the App</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              <li>Maintain the security of your device and account</li>
              <li>Not share your account credentials with others</li>
              <li>Report any security breaches or unauthorized access immediately</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Split Expense Features:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>When using split expense features, you agree to accurately represent shared expenses</li>
              <li>You are responsible for resolving disputes with other members of expense splits</li>
              <li>We are not responsible for disputes between users regarding shared expenses</li>
            </ul>
            <p className="mt-4">
              You are solely responsible for the accuracy of the financial data you enter into the App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Financial Information and Data</h2>
            <p className="mb-4">The App allows you to input, store, and manage your personal financial information. You acknowledge that:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>All financial data entered is your responsibility</li>
              <li>We do not verify the accuracy of your financial information</li>
              <li>The App is a tool to help you organize your finances, not a substitute for professional financial advice</li>
              <li>We are not responsible for any financial decisions you make based on App data or AI recommendations</li>
              <li>Stock analysis, mutual fund information, and financial calculations are for informational purposes only</li>
              <li>You should consult with qualified financial professionals for investment, tax, or legal advice</li>
              <li>We do not provide investment recommendations or guarantee any investment outcomes</li>
              <li>Past performance of stocks or funds does not guarantee future results</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">AI-Powered Features:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>AI chatbot responses and financial tips are generated for informational and educational purposes</li>
              <li>AI analysis should not be considered as personalized financial, legal, or investment advice</li>
              <li>Always verify AI-generated information independently before making financial decisions</li>
            </ul>
            <p className="mt-4">
              We use industry-standard security measures to protect your data, but cannot guarantee absolute security. You are responsible for maintaining 
              the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. No In-App Sales or Payments</h2>
            <p className="mb-4 font-semibold">IMPORTANT: BrokeNoMore does not sell any products, services, or subscriptions within the mobile application.</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>The App is provided as a free personal finance management tool</li>
              <li>All core features are available without payment</li>
              <li>No purchases, subscriptions, or payments can be made within the App</li>
              <li>The App does not process any payment transactions or store payment information</li>
              <li>No third-party payment processors (such as Razorpay, Stripe, or app store billing) are integrated into the App</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">AI Features and Credits:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Certain AI-powered features (chatbot, stock analysis) may require credits to use</li>
              <li>Credits cannot be purchased within the App</li>
              <li>If you wish to purchase credits, these transactions are conducted exclusively through our website, not through the App</li>
              <li>Credits purchased externally are managed through your account and consumed when using AI features</li>
              <li>Any external transactions are subject to separate terms and conditions available on our website</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Subscription Plans:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Subscription plans, if available, are managed through external systems, not within the App</li>
              <li>The App does not handle subscription payments or renewals</li>
              <li>All subscription-related transactions occur outside of the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p>
              The App, including its design, features, content, and functionality, is owned by BrokeNoMore and protected by copyright, trademark, 
              and other intellectual property laws.
            </p>
            <p className="mt-4">You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes. You may not:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Copy, modify, or distribute the App</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use our trademarks or logos without permission</li>
              <li>Create derivative works based on the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Prohibited Uses</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Use the App for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to access other users&apos; accounts or data</li>
              <li>Use automated systems to access the App without permission</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest information about other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Disclaimer of Warranties</h2>
            <p className="mb-4 font-semibold">
              THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>WARRANTIES OF MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY OR RELIABILITY OF INFORMATION</li>
            </ul>
            <p className="mt-4">
              We do not warrant that the App will be uninterrupted, error-free, or secure. We are not responsible for any loss of data or financial information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="mb-4 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROKENOMORE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>LOSS OF PROFITS, DATA, OR USE</li>
              <li>FINANCIAL LOSSES RESULTING FROM USE OF THE APP</li>
              <li>DECISIONS MADE BASED ON APP DATA OR RECOMMENDATIONS</li>
            </ul>
            <p className="mt-4">
              Our total liability shall not exceed the amount you paid for the App in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="mb-4">We reserve the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Suspend or terminate your account at any time for violation of these terms</li>
              <li>Discontinue or modify the App or any features at any time</li>
              <li>Refuse service to anyone for any reason</li>
            </ul>
            <p className="mt-4">You may terminate your account at any time by deleting the App or contacting support. Upon termination:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Your access to the App will immediately cease</li>
              <li>You may request deletion of your data (subject to legal retention requirements)</li>
              <li>Any credits or subscriptions purchased externally will be governed by separate terms</li>
              <li>We are not obligated to provide refunds for external purchases made through our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Data Privacy</h2>
            <p>
              Your use of the App is also governed by our Privacy Policy. We are committed to protecting your personal information and financial data. 
              Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms and Conditions at any time. We will notify users of significant changes through:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>In-app notifications</li>
              <li>Email notifications (if provided)</li>
              <li>Updated version of the App</li>
            </ul>
            <p className="mt-4">
              Your continued use of the App after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which BrokeNoMore operates, 
              without regard to conflict of law provisions.
            </p>
            <p className="mt-4">
              Any disputes arising from these terms or your use of the App shall be resolved through binding arbitration or in the appropriate courts of jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="mb-4">If you have any questions about these Terms and Conditions, please contact us through:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>In-app support feature</li>
              <li>Email: support@brokenomore.com</li>
              <li>Contact Support section in the App</li>
            </ul>
            <p className="mt-4">We aim to respond to all inquiries within 48 hours during business days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acknowledgment</h2>
            <p>
              By using BrokeNoMore, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
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

