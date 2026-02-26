"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        {/* Header Information */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy for BNM (Broke No More)</h2>
          <p className="text-gray-700 mb-3 text-lg">
            <strong>BNM (Broke No More)</strong> is a personal finance management application published by <strong>Kushagra & Vruddhi</strong>.
          </p>
          <p className="text-gray-700 text-lg">
            This Privacy Policy describes how BNM collects, uses, and protects user information when you use the BNM mobile application available on <strong>Google Play Store</strong>.
          </p>
        </div>

        <p className="text-gray-600 mb-6">Last updated: December 29, 2024</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              BrokeNoMore ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our mobile application ("App").
            </p>
            <p className="mt-4">
              Please read this Privacy Policy carefully. By using the App, you consent to the data practices described in this policy. 
              If you do not agree with the practices described, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us and information that is automatically collected when you use the App:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Personal Information:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Name, email address, and profile information</li>
              <li>Age, gender, occupation, education level, and location (optional)</li>
              <li>Monthly income and financial goals</li>
              <li>Account credentials and authentication data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Financial Information:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Transaction data (expenses, income, amounts, categories, dates)</li>
              <li>Budget information and spending limits</li>
              <li>Bill reminders and due dates</li>
              <li>Loan information, EMI schedules, and repayment tracking</li>
              <li>Split expense data and group member information</li>
              <li>Financial goals, progress, and targets</li>
              <li>Stock analysis queries and mutual fund research data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Device and Usage Information:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Device type, operating system, model, and unique device identifiers</li>
              <li>Device fingerprint for security and fraud prevention</li>
              <li>App usage patterns, feature interactions, and navigation paths</li>
              <li>IP address and network information</li>
              <li>Crash reports, error logs, and performance data</li>
              <li>App version and installation information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Biometric Data:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Biometric authentication data (fingerprint, face recognition)</li>
              <li>Stored securely on your device using secure storage, NOT transmitted to our servers</li>
              <li>Used only for local device authentication to unlock the App</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">AI Interaction Data:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Chatbot conversation history</li>
              <li>Stock analysis queries and results</li>
              <li>Financial tip preferences</li>
              <li>Feature usage statistics for AI-powered features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Service Provision:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>To provide, maintain, and improve the App&apos;s features and functionality</li>
              <li>To process transactions and manage your financial data</li>
              <li>To generate insights, reports, and financial summaries</li>
              <li>To deliver personalized AI-powered financial tips and recommendations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Account Management:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>To create and manage your account</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To communicate with you about your account and our services</li>
              <li>To provide customer support and respond to inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Service Improvement:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>To analyze usage patterns and improve App performance</li>
              <li>To develop new features and services</li>
              <li>To conduct research and analytics</li>
              <li>To detect and prevent fraud, abuse, or security issues</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Legal Compliance:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>To comply with applicable laws and regulations</li>
              <li>To respond to legal requests and protect our rights</li>
              <li>To enforce our Terms and Conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Security Measures:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Encryption of data in transit using SSL/TLS protocols</li>
              <li>Secure storage of data using encrypted databases</li>
              <li>Authentication and authorization controls</li>
              <li>Regular security audits and updates</li>
              <li>Secure password hashing and storage</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Location:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Your data is stored on secure cloud servers</li>
              <li>We use reputable cloud service providers with strong security practices</li>
              <li>Data may be stored in servers located in different geographic regions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Your Responsibility:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Keep your account credentials confidential</li>
              <li>Use strong, unique passwords</li>
              <li>Enable biometric or app lock features for additional security</li>
              <li>Log out when using shared devices</li>
              <li>Notify us immediately of any security breaches</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4 font-semibold">WE DO NOT SELL YOUR PERSONAL OR FINANCIAL INFORMATION TO ANY THIRD PARTIES.</p>
            <p className="mb-4">We may share your information only in the following limited circumstances:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Service Providers:</h3>
            <p className="mb-2">With third-party service providers who assist in operating the App:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Cloud storage providers (Supabase) for secure data hosting</li>
              <li>Analytics services for app improvement (anonymized data only)</li>
              <li>AI service providers for chatbot and financial analysis features</li>
              <li>These providers are contractually obligated to protect your information</li>
              <li>They are prohibited from using your data for any purpose other than providing services to us</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Legal Requirements:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>When required by law, court order, or government regulation</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>To investigate fraud, security issues, or violations of our Terms</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Business Transfers:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>In connection with a merger, acquisition, or sale of assets</li>
              <li>Your information may be transferred as part of such transactions</li>
              <li>We will notify you of such changes and ensure your information remains protected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">To exercise these rights, please contact us through the App&apos;s support feature or email support@brokenomore.com.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Children&apos;s Privacy</h2>
            <p>
              The App is not intended for users under the age of 18. We do not knowingly collect personal information from children.
            </p>
            <p className="mt-4">
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. 
              We will delete such information upon verification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
            <p className="mb-4">We retain your information for as long as necessary to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Provide services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain security and prevent fraud</li>
              <li>Support our business operations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Retention Periods:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Active accounts: Data retained while account is active and for a reasonable period thereafter</li>
              <li>Deleted accounts: Most data deleted within 30 days of account deletion request</li>
              <li>Financial transactions: May be retained for up to 7 years for tax and legal compliance</li>
              <li>Legal requirements: Some data may be retained longer for legal compliance or ongoing disputes</li>
              <li>Backup systems: Data may remain in secure backups for up to 90 days before permanent deletion</li>
              <li>Credit transactions: Retained for accounting and fraud prevention purposes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Credit Balance:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>If you have purchased credits, your credit balance and transaction history will be retained even if you delete your account, unless you specifically request deletion</li>
              <li>Deleted credits cannot be refunded or restored</li>
            </ul>

            <p className="mt-4">You can request deletion of your data at any time through account settings or by contacting support.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.
            </p>
            <p className="mt-4">We ensure that appropriate safeguards are in place to protect your information during international transfers, including:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>Standard contractual clauses</li>
              <li>Adequacy decisions</li>
              <li>Other legal mechanisms as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Cookies and Tracking Technologies</h2>
            <p>The App may use cookies and similar tracking technologies to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Analyze App usage and performance</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="mt-4">
              You can control cookie preferences through your device settings, though this may affect App functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Changes to Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>In-app notifications</li>
              <li>Email notifications (if provided)</li>
              <li>Updated version of the App</li>
              <li>Prominent notice on our website (if applicable)</li>
            </ul>
            <p className="mt-4">
              Your continued use of the App after changes constitutes acceptance of the updated Privacy Policy. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. California Privacy Rights</h2>
            <p className="mb-4">If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Right to Know:</strong> Request disclosure of what personal information we collect, use, and share</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information (subject to legal exceptions)</li>
              <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (WE DO NOT SELL YOUR INFORMATION)</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to Exercise Your Rights:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Contact us through the App&apos;s support feature</li>
              <li>Email us at: support@brokenomore.com</li>
              <li>Include &quot;California Privacy Rights Request&quot; in the subject line</li>
              <li>Provide sufficient information to verify your identity</li>
            </ul>
            <p className="mt-4">We will respond to your request within 45 days as required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. GDPR Rights (EU Users)</h2>
            <p className="mb-4">If you are located in the European Union, you have additional rights under the General Data Protection Regulation (GDPR):</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Right of access to your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p className="mt-4">To exercise these rights, contact us through the App&apos;s support feature.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Us</h2>
            <p className="mb-4">If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Support Email:</strong> support@brokenomore.com</li>
              <li><strong>In-App Support:</strong> Use the Contact Support feature in the App</li>
              <li><strong>Response Time:</strong> We aim to respond within 48 hours during business days</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Protection Requests:</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>For data access, deletion, or correction requests, please specify your request clearly</li>
              <li>Include your registered email address for verification</li>
              <li>We may require additional verification to protect your account security</li>
            </ul>
            <p className="mt-4">
              We are committed to addressing your privacy concerns and protecting your personal information. Your privacy matters to us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acknowledgment</h2>
            <p>
              By using BrokeNoMore, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, 
              use, and disclosure of your information as described herein.
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

