import type { Metadata } from 'next';
import LegalLayout, { A, B, Callout, List, Section, Sub } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | BrokeNoMore',
  description: 'How BNM (Broke No More) collects, uses, and protects user information.',
};

const TOC = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'storage-security', title: '4. Data Storage and Security' },
  { id: 'sharing', title: '5. Data Sharing and Disclosure' },
  { id: 'google-api-disclosure', title: 'Google API & Gmail' },
  { id: 'your-rights', title: '6. Your Rights' },
  { id: 'children', title: "7. Children's Privacy" },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'international', title: '9. International Data Transfers' },
  { id: 'cookies', title: '10. Cookies and Tracking' },
  { id: 'changes', title: '11. Changes to Privacy Policy' },
  { id: 'california', title: '12. California Privacy Rights' },
  { id: 'gdpr', title: '13. GDPR Rights (EU Users)' },
  { id: 'contact', title: '14. Contact Us' },
  { id: 'acknowledgment', title: 'Acknowledgment' },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      updated="December 29, 2024"
      current="/privacy"
      toc={TOC}
      intro={
        <>
          <p className="text-xl font-medium text-white">Privacy Policy for BNM (Broke No More)</p>
          <p>
            <B>BNM (Broke No More)</B> is a personal finance management application published by <B>Kushagra &amp; Vruddhi</B>.
          </p>
          <p>
            This Privacy Policy describes how BNM collects, uses, and protects user information when you use the BNM mobile application
            available on <B>Google Play Store</B>.
          </p>
        </>
      }
    >
      <Section id="introduction" title="1. Introduction">
        <p>
          BrokeNoMore (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you use our mobile application (&quot;App&quot;).
        </p>
        <p>
          Please read this Privacy Policy carefully. By using the App, you consent to the data practices described in this policy. If you do not
          agree with the practices described, please do not use the App.
        </p>
      </Section>

      <Section id="information-we-collect" title="2. Information We Collect">
        <p>We collect information that you provide directly to us and information that is automatically collected when you use the App:</p>
        <Sub>Personal Information:</Sub>
        <List
          items={[
            'Name, email address, and profile information',
            'Age, gender, occupation, education level, and location (optional)',
            'Monthly income and financial goals',
            'Account credentials and authentication data',
          ]}
        />
        <Sub>Financial Information:</Sub>
        <List
          items={[
            'Transaction data (expenses, income, amounts, categories, dates)',
            'Budget information and spending limits',
            'Bill reminders and due dates',
            'Loan information, EMI schedules, and repayment tracking',
            'Split expense data and group member information',
            'Financial goals, progress, and targets',
            'Stock analysis queries and mutual fund research data',
          ]}
        />
        <Sub>Device and Usage Information:</Sub>
        <List
          items={[
            'Device type, operating system, model, and unique device identifiers',
            'Device fingerprint for security and fraud prevention',
            'App usage patterns, feature interactions, and navigation paths',
            'IP address and network information',
            'Crash reports, error logs, and performance data',
            'App version and installation information',
          ]}
        />
        <Sub>Biometric Data:</Sub>
        <List
          items={[
            'Biometric authentication data (fingerprint, face recognition)',
            'Stored securely on your device using secure storage, NOT transmitted to our servers',
            'Used only for local device authentication to unlock the App',
          ]}
        />
        <Sub>AI Interaction Data:</Sub>
        <List
          items={[
            'Chatbot conversation history',
            'Stock analysis queries and results',
            'Financial tip preferences',
            'Feature usage statistics for AI-powered features',
          ]}
        />
      </Section>

      <Section id="how-we-use" title="3. How We Use Your Information">
        <p>We use the collected information for the following purposes:</p>
        <Sub>Service Provision:</Sub>
        <List
          items={[
            "To provide, maintain, and improve the App's features and functionality",
            'To process transactions and manage your financial data',
            'To generate insights, reports, and financial summaries',
            'To deliver personalized AI-powered financial tips and recommendations',
          ]}
        />
        <Sub>Account Management:</Sub>
        <List
          items={[
            'To create and manage your account',
            'To authenticate your identity and secure your account',
            'To communicate with you about your account and our services',
            'To provide customer support and respond to inquiries',
          ]}
        />
        <Sub>Service Improvement:</Sub>
        <List
          items={[
            'To analyze usage patterns and improve App performance',
            'To develop new features and services',
            'To conduct research and analytics',
            'To detect and prevent fraud, abuse, or security issues',
          ]}
        />
        <Sub>Legal Compliance:</Sub>
        <List
          items={[
            'To comply with applicable laws and regulations',
            'To respond to legal requests and protect our rights',
            'To enforce our Terms and Conditions',
          ]}
        />
      </Section>

      <Section id="storage-security" title="4. Data Storage and Security">
        <p>We implement industry-standard security measures to protect your information:</p>
        <Sub>Security Measures:</Sub>
        <List
          items={[
            'Encryption of data in transit using SSL/TLS protocols',
            'Secure storage of data using encrypted databases',
            'Authentication and authorization controls',
            'Regular security audits and updates',
            'Secure password hashing and storage',
          ]}
        />
        <Sub>Data Location:</Sub>
        <List
          items={[
            'Your data is stored on secure cloud servers',
            'We use reputable cloud service providers with strong security practices',
            'Data may be stored in servers located in different geographic regions',
          ]}
        />
        <Sub>Your Responsibility:</Sub>
        <List
          items={[
            'Keep your account credentials confidential',
            'Use strong, unique passwords',
            'Enable biometric or app lock features for additional security',
            'Log out when using shared devices',
            'Notify us immediately of any security breaches',
          ]}
        />
      </Section>

      <Section id="sharing" title="5. Data Sharing and Disclosure">
        <Callout>
          <p className="font-semibold">WE DO NOT SELL YOUR PERSONAL OR FINANCIAL INFORMATION TO ANY THIRD PARTIES.</p>
        </Callout>
        <p>We may share your information only in the following limited circumstances:</p>
        <Sub>Service Providers:</Sub>
        <p>With third-party service providers who assist in operating the App:</p>
        <List
          items={[
            'Cloud storage providers (Supabase) for secure data hosting',
            'Analytics services for app improvement (anonymized data only)',
            'AI service providers for chatbot and financial analysis features',
            'These providers are contractually obligated to protect your information',
            'They are prohibited from using your data for any purpose other than providing services to us',
          ]}
        />
        <Sub>Legal Requirements:</Sub>
        <List
          items={[
            'When required by law, court order, or government regulation',
            'To protect our rights, property, or safety, or that of our users',
            'To investigate fraud, security issues, or violations of our Terms',
          ]}
        />
        <Sub>Business Transfers:</Sub>
        <List
          items={[
            'In connection with a merger, acquisition, or sale of assets',
            'Your information may be transferred as part of such transactions',
            'We will notify you of such changes and ensure your information remains protected',
          ]}
        />
      </Section>

      <Section id="google-api-disclosure" title="Google API Services User Data Policy & Gmail Integration (Limited Use Disclosure)">
        <p>
          Broke No More (BNM) provides an optional feature allowing users to connect their Google account to scan and identify recurring bills
          and digital subscriptions.
        </p>
        <Sub>1. Data Accessed and Purpose</Sub>
        <List
          items={[
            <>
              When you link your Gmail account, we request the{' '}
              <code className="break-all rounded bg-[#1f1f1f] px-1.5 py-0.5 font-mono text-sm text-[#C9B8F0]">
                https://www.googleapis.com/auth/gmail.readonly
              </code>{' '}
              permission.
            </>,
            'We access only relevant message headers and receipt snippets (e.g., invoices from utility providers, telecom operators, and subscription services).',
            'This data is accessed solely to identify upcoming payment due dates, amounts, and vendor names to populate your personal Bills & Subscriptions tracker.',
          ]}
        />
        <Sub>2. Data Storage, Sharing, and Protection</Sub>
        <List
          items={[
            <>
              <B>No Raw Email Storage:</B> We do not permanently store, copy, or retain your raw email content or message bodies on our external
              servers.
            </>,
            <>
              <B>No Advertising or Profiling:</B> We never sell, transfer, or use your Gmail content for serving advertisements, personalized
              marketing, or creditworthiness evaluation.
            </>,
            <>
              <B>No Model Training:</B> Your email data is not used to train generalized artificial intelligence or machine learning models.
            </>,
            <>
              <B>User Control &amp; Revocation:</B> You can disconnect your Gmail account at any time within the app settings under{' '}
              <em>Manage Tracking</em>, or directly revoke access via your{' '}
              <A href="https://myaccount.google.com/permissions">Google Account Permissions</A>. Upon disconnection, all active session tokens
              are immediately deleted.
            </>,
          ]}
        />
        <Sub>3. Google API Limited Use Policy</Sub>
        <p>
          Broke No More&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
          <A href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</A>, including the
          Limited Use requirements.
        </p>
      </Section>

      <Section id="your-rights" title="6. Your Rights">
        <p>You have the right to:</p>
        <List
          items={[
            'Access and receive a copy of your personal data',
            'Rectify inaccurate or incomplete data',
            'Request deletion of your personal data',
            'Object to processing of your personal data',
            'Request restriction of processing',
            'Data portability',
            'Withdraw consent at any time',
          ]}
        />
        <p>
          To exercise these rights, please contact us through the App&apos;s support feature or email{' '}
          <A href="mailto:support@brokenomore.com">support@brokenomore.com</A>.
        </p>
      </Section>

      <Section id="children" title="7. Children's Privacy">
        <p>The App is not intended for users under the age of 18. We do not knowingly collect personal information from children.</p>
        <p>
          If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We
          will delete such information upon verification.
        </p>
      </Section>

      <Section id="retention" title="8. Data Retention">
        <p>We retain your information for as long as necessary to:</p>
        <List
          items={[
            'Provide services to you',
            'Comply with legal obligations',
            'Resolve disputes and enforce agreements',
            'Maintain security and prevent fraud',
            'Support our business operations',
          ]}
        />
        <Sub>Retention Periods:</Sub>
        <List
          items={[
            'Active accounts: Data retained while account is active and for a reasonable period thereafter',
            'Deleted accounts: Most data deleted within 30 days of account deletion request',
            'Financial transactions: May be retained for up to 7 years for tax and legal compliance',
            'Legal requirements: Some data may be retained longer for legal compliance or ongoing disputes',
            'Backup systems: Data may remain in secure backups for up to 90 days before permanent deletion',
            'Credit transactions: Retained for accounting and fraud prevention purposes',
          ]}
        />
        <Sub>Credit Balance:</Sub>
        <List
          items={[
            'If you have purchased credits, your credit balance and transaction history will be retained even if you delete your account, unless you specifically request deletion',
            'Deleted credits cannot be refunded or restored',
          ]}
        />
        <p>You can request deletion of your data at any time through account settings or by contacting support.</p>
      </Section>

      <Section id="international" title="9. International Data Transfers">
        <p>
          Your information may be transferred to and processed in countries other than your country of residence. These countries may have
          different data protection laws.
        </p>
        <p>We ensure that appropriate safeguards are in place to protect your information during international transfers, including:</p>
        <List items={['Standard contractual clauses', 'Adequacy decisions', 'Other legal mechanisms as required by law']} />
      </Section>

      <Section id="cookies" title="10. Cookies and Tracking Technologies">
        <p>The App may use cookies and similar tracking technologies to:</p>
        <List
          items={[
            'Remember your preferences and settings',
            'Analyze App usage and performance',
            'Provide personalized content and recommendations',
          ]}
        />
        <p>You can control cookie preferences through your device settings, though this may affect App functionality.</p>
      </Section>

      <Section id="changes" title="11. Changes to Privacy Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through:</p>
        <List
          items={[
            'In-app notifications',
            'Email notifications (if provided)',
            'Updated version of the App',
            'Prominent notice on our website (if applicable)',
          ]}
        />
        <p>
          Your continued use of the App after changes constitutes acceptance of the updated Privacy Policy. We encourage you to review this policy
          periodically.
        </p>
      </Section>

      <Section id="california" title="12. California Privacy Rights">
        <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
        <List
          items={[
            <>
              <B>Right to Know:</B> Request disclosure of what personal information we collect, use, and share
            </>,
            <>
              <B>Right to Delete:</B> Request deletion of your personal information (subject to legal exceptions)
            </>,
            <>
              <B>Right to Opt-Out:</B> Opt-out of the sale of personal information (WE DO NOT SELL YOUR INFORMATION)
            </>,
            <>
              <B>Right to Non-Discrimination:</B> We will not discriminate against you for exercising your privacy rights
            </>,
          ]}
        />
        <Sub>How to Exercise Your Rights:</Sub>
        <List
          items={[
            "Contact us through the App's support feature",
            <>
              Email us at: <A href="mailto:support@brokenomore.com">support@brokenomore.com</A>
            </>,
            'Include "California Privacy Rights Request" in the subject line',
            'Provide sufficient information to verify your identity',
          ]}
        />
        <p>We will respond to your request within 45 days as required by law.</p>
      </Section>

      <Section id="gdpr" title="13. GDPR Rights (EU Users)">
        <p>If you are located in the European Union, you have additional rights under the General Data Protection Regulation (GDPR):</p>
        <List
          items={[
            'Right of access to your personal data',
            'Right to rectification of inaccurate data',
            'Right to erasure ("right to be forgotten")',
            'Right to restrict processing',
            'Right to data portability',
            'Right to object to processing',
            'Right to withdraw consent',
          ]}
        />
        <p>To exercise these rights, contact us through the App&apos;s support feature.</p>
      </Section>

      <Section id="contact" title="14. Contact Us">
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
        <List
          items={[
            <>
              <B>Support Email:</B> <A href="mailto:support@brokenomore.com">support@brokenomore.com</A>
            </>,
            <>
              <B>In-App Support:</B> Use the Contact Support feature in the App
            </>,
            <>
              <B>Response Time:</B> We aim to respond within 48 hours during business days
            </>,
          ]}
        />
        <Sub>Data Protection Requests:</Sub>
        <List
          items={[
            'For data access, deletion, or correction requests, please specify your request clearly',
            'Include your registered email address for verification',
            'We may require additional verification to protect your account security',
          ]}
        />
        <p>We are committed to addressing your privacy concerns and protecting your personal information. Your privacy matters to us.</p>
      </Section>

      <Section id="acknowledgment" title="Acknowledgment">
        <Callout>
          <p>
            By using BrokeNoMore, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and
            disclosure of your information as described herein.
          </p>
        </Callout>
      </Section>
    </LegalLayout>
  );
}
