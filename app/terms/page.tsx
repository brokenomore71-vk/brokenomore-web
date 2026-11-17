import type { Metadata } from 'next';
import LegalLayout, { A, Callout, List, Section, Sub } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions for using the BrokeNoMore mobile application.",
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms", title: "Terms & Conditions | BrokeNoMore", description: "The terms and conditions for using the BrokeNoMore mobile application." },
};

const TOC = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'service', title: '2. Description of Service' },
  { id: 'accounts', title: '3. User Accounts' },
  { id: 'responsibilities', title: '4. User Responsibilities' },
  { id: 'financial-data', title: '5. Financial Information' },
  { id: 'no-in-app-sales', title: '6. No In-App Sales' },
  { id: 'ip', title: '7. Intellectual Property' },
  { id: 'prohibited', title: '8. Prohibited Uses' },
  { id: 'warranties', title: '9. Disclaimer of Warranties' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'termination', title: '11. Termination' },
  { id: 'privacy', title: '12. Data Privacy' },
  { id: 'changes', title: '13. Changes to Terms' },
  { id: 'law', title: '14. Governing Law' },
  { id: 'contact', title: '15. Contact Information' },
  { id: 'acknowledgment', title: 'Acknowledgment' },
];

export default function TermsPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Terms & Conditions" updated="December 29, 2024" current="/terms" toc={TOC}>
      <Section id="acceptance" title="1. Acceptance of Terms">
        <p>
          By downloading, installing, or using the BrokeNoMore mobile application (&quot;App&quot;), you agree to be bound by these Terms and
          Conditions. If you do not agree to these terms, please do not use the App.
        </p>
        <p>
          Your use of the App constitutes your acceptance of these Terms and Conditions and our Privacy Policy. We reserve the right to modify
          these terms at any time, and such modifications will be effective immediately upon posting.
        </p>
      </Section>

      <Section id="service" title="2. Description of Service">
        <p>BrokeNoMore is a personal finance management application designed to help users:</p>
        <List
          items={[
            'Track expenses and income transactions',
            'Manage budgets and financial goals',
            'Monitor spending patterns and analytics',
            'Set up bill reminders and payment tracking',
            'Track loans and EMI schedules',
            'Split expenses with friends and family',
            'Use financial calculators (EMI, FD, SIP, PPF, Lumpsum, SWP)',
            'Analyze stocks and mutual funds',
            'Access AI-powered financial chatbot for guidance',
            'Receive personalized financial tips and insights',
            'View comprehensive financial analytics and reports',
          ]}
        />
        <p>
          The App provides tools and features to assist with personal financial management but does not provide financial, investment, or legal
          advice. All calculations and recommendations are for informational purposes only.
        </p>
      </Section>

      <Section id="accounts" title="3. User Accounts and Registration">
        <p>
          To use certain features of the App, you must create an account by providing accurate and complete information. You are responsible for:
        </p>
        <List
          items={[
            'Maintaining the confidentiality of your account credentials',
            'All activities that occur under your account',
            'Ensuring your account information is current and accurate',
            'Notifying us immediately of any unauthorized use of your account',
          ]}
        />
        <p>You must be at least 18 years old to use this App. By creating an account, you represent that you meet this age requirement.</p>
      </Section>

      <Section id="responsibilities" title="4. User Responsibilities">
        <p>You agree to:</p>
        <List
          items={[
            'Use the App only for lawful purposes',
            'Provide accurate financial information',
            'Maintain the confidentiality of your account credentials',
            'Not attempt to gain unauthorized access to the App or its systems',
            "Not interfere with or disrupt the App's functionality or servers",
            'Not use the App to transmit any malicious code, viruses, or harmful content',
            'Not attempt to reverse engineer, decompile, or extract source code from the App',
            'Not use automated systems, bots, or scripts to access the App',
            'Comply with all applicable laws and regulations in your jurisdiction',
            'Maintain the security of your device and account',
            'Not share your account credentials with others',
            'Report any security breaches or unauthorized access immediately',
          ]}
        />
        <Sub>Split Expense Features:</Sub>
        <List
          items={[
            'When using split expense features, you agree to accurately represent shared expenses',
            'You are responsible for resolving disputes with other members of expense splits',
            'We are not responsible for disputes between users regarding shared expenses',
          ]}
        />
        <p>You are solely responsible for the accuracy of the financial data you enter into the App.</p>
      </Section>

      <Section id="financial-data" title="5. Financial Information and Data">
        <p>The App allows you to input, store, and manage your personal financial information. You acknowledge that:</p>
        <List
          items={[
            'All financial data entered is your responsibility',
            'We do not verify the accuracy of your financial information',
            'The App is a tool to help you organize your finances, not a substitute for professional financial advice',
            'We are not responsible for any financial decisions you make based on App data or AI recommendations',
            'Stock analysis, mutual fund information, and financial calculations are for informational purposes only',
            'You should consult with qualified financial professionals for investment, tax, or legal advice',
            'We do not provide investment recommendations or guarantee any investment outcomes',
            'Past performance of stocks or funds does not guarantee future results',
          ]}
        />
        <Sub>AI-Powered Features:</Sub>
        <List
          items={[
            'AI chatbot responses and financial tips are generated for informational and educational purposes',
            'AI analysis should not be considered as personalized financial, legal, or investment advice',
            'Always verify AI-generated information independently before making financial decisions',
          ]}
        />
        <p>
          We use industry-standard security measures to protect your data, but cannot guarantee absolute security. You are responsible for
          maintaining the security of your account credentials.
        </p>
      </Section>

      <Section id="no-in-app-sales" title="6. No In-App Sales or Payments">
        <Callout>
          <p className="font-semibold">
            IMPORTANT: BrokeNoMore does not sell any products, services, or subscriptions within the mobile application.
          </p>
        </Callout>
        <List
          items={[
            'The App is provided as a free personal finance management tool',
            'All core features are available without payment',
            'No purchases, subscriptions, or payments can be made within the App',
            'The App does not process any payment transactions or store payment information',
            'No third-party payment processors (such as Razorpay, Stripe, or app store billing) are integrated into the App',
          ]}
        />
        <Sub>AI Features and Credits:</Sub>
        <List
          items={[
            'Certain AI-powered features (chatbot, stock analysis) may require credits to use',
            'Credits cannot be purchased within the App',
            'If you wish to purchase credits, these transactions are conducted exclusively through our website, not through the App',
            'Credits purchased externally are managed through your account and consumed when using AI features',
            'Any external transactions are subject to separate terms and conditions available on our website',
          ]}
        />
        <Sub>Subscription Plans:</Sub>
        <List
          items={[
            'Subscription plans, if available, are managed through external systems, not within the App',
            'The App does not handle subscription payments or renewals',
            'All subscription-related transactions occur outside of the App',
          ]}
        />
      </Section>

      <Section id="ip" title="7. Intellectual Property">
        <p>
          The App, including its design, features, content, and functionality, is owned by BrokeNoMore and protected by copyright, trademark, and
          other intellectual property laws.
        </p>
        <p>You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes. You may not:</p>
        <List
          items={[
            'Copy, modify, or distribute the App',
            'Reverse engineer or attempt to extract source code',
            'Use our trademarks or logos without permission',
            'Create derivative works based on the App',
          ]}
        />
      </Section>

      <Section id="prohibited" title="8. Prohibited Uses">
        <p>You agree not to:</p>
        <List
          items={[
            'Use the App for any illegal or unauthorized purpose',
            'Violate any laws in your jurisdiction',
            'Infringe upon the rights of others',
            'Transmit any viruses, malware, or harmful code',
            "Attempt to access other users' accounts or data",
            'Use automated systems to access the App without permission',
            'Impersonate any person or entity',
            'Collect or harvest information about other users',
          ]}
        />
      </Section>

      <Section id="warranties" title="9. Disclaimer of Warranties">
        <p className="font-semibold text-neutral-200">
          THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
          BUT NOT LIMITED TO:
        </p>
        <List
          items={[
            'WARRANTIES OF MERCHANTABILITY',
            'FITNESS FOR A PARTICULAR PURPOSE',
            'NON-INFRINGEMENT',
            'ACCURACY OR RELIABILITY OF INFORMATION',
          ]}
        />
        <p>
          We do not warrant that the App will be uninterrupted, error-free, or secure. We are not responsible for any loss of data or financial
          information.
        </p>
      </Section>

      <Section id="liability" title="10. Limitation of Liability">
        <p className="font-semibold text-neutral-200">TO THE MAXIMUM EXTENT PERMITTED BY LAW, BROKENOMORE SHALL NOT BE LIABLE FOR:</p>
        <List
          items={[
            'ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES',
            'LOSS OF PROFITS, DATA, OR USE',
            'FINANCIAL LOSSES RESULTING FROM USE OF THE APP',
            'DECISIONS MADE BASED ON APP DATA OR RECOMMENDATIONS',
          ]}
        />
        <p>Our total liability shall not exceed the amount you paid for the App in the 12 months preceding the claim.</p>
      </Section>

      <Section id="termination" title="11. Termination">
        <p>We reserve the right to:</p>
        <List
          items={[
            'Suspend or terminate your account at any time for violation of these terms',
            'Discontinue or modify the App or any features at any time',
            'Refuse service to anyone for any reason',
          ]}
        />
        <p>You may terminate your account at any time by deleting the App or contacting support. Upon termination:</p>
        <List
          items={[
            'Your access to the App will immediately cease',
            'You may request deletion of your data (subject to legal retention requirements)',
            'Any credits or subscriptions purchased externally will be governed by separate terms',
            'We are not obligated to provide refunds for external purchases made through our website',
          ]}
        />
      </Section>

      <Section id="privacy" title="12. Data Privacy">
        <p>
          Your use of the App is also governed by our <A href="/privacy">Privacy Policy</A>. We are committed to protecting your personal
          information and financial data. Please review our Privacy Policy to understand how we collect, use, and protect your information.
        </p>
      </Section>

      <Section id="changes" title="13. Changes to Terms">
        <p>We reserve the right to modify these Terms and Conditions at any time. We will notify users of significant changes through:</p>
        <List items={['In-app notifications', 'Email notifications (if provided)', 'Updated version of the App']} />
        <p>Your continued use of the App after changes constitutes acceptance of the modified terms.</p>
      </Section>

      <Section id="law" title="14. Governing Law">
        <p>
          These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which BrokeNoMore
          operates, without regard to conflict of law provisions.
        </p>
        <p>
          Any disputes arising from these terms or your use of the App shall be resolved through binding arbitration or in the appropriate courts
          of jurisdiction.
        </p>
      </Section>

      <Section id="contact" title="15. Contact Information">
        <p>If you have any questions about these Terms and Conditions, please contact us through:</p>
        <List
          items={[
            'In-app support feature',
            <>
              Email: <A href="mailto:support@brokenomore.com">support@brokenomore.com</A>
            </>,
            'Contact Support section in the App',
          ]}
        />
        <p>We aim to respond to all inquiries within 48 hours during business days.</p>
      </Section>

      <Section id="acknowledgment" title="Acknowledgment">
        <Callout>
          <p>By using BrokeNoMore, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
        </Callout>
      </Section>
    </LegalLayout>
  );
}
