// The FAQ: shown by components/FAQSection.tsx, and given to search engines as FAQ structured data
// (app/page.tsx). Plain data, so the server side can read it too.

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  items: FAQItem[];
}

// The same questions and answers as the app's Help & Support page
// (lib/pages/profile_page/help_support_page.dart in the app), so the two stay in step
const faq = (id: string, question: string, answer: string): FAQItem => ({ id, question, answer });

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'account',
    name: 'Account & Support',
    items: [
      faq('acc-1', 'What is Broke AI?', 'Broke AI is your personal financial assistant. It analyzes your spending, savings, and financial habits to provide personalized insights, answer money-related questions, and help you make smarter financial decisions.'),
      faq('acc-2', 'How does Broke AI work?', 'Broke AI securely analyzes the financial information you choose to share within the app, such as your expenses and budgets. It uses AI to generate personalized recommendations based on your financial habits.'),
      faq('acc-3', 'Is Broke AI a financial advisor?', 'No. Broke AI provides educational insights and personalized suggestions based on your financial data. It should not be considered professional financial or investment advice.'),
      faq('acc-4', 'Is my financial data secure?', 'Yes. We use industry-standard security practices to help protect your information. Your data is handled securely and with your privacy in mind.'),
      faq('acc-5', 'Does BrokeNoMore sell my personal data?', 'No. Your personal information is not sold to third parties.'),
      faq('acc-6', 'Can I delete my account?', 'Yes. You can permanently delete your account from the Settings section.'),
      faq('acc-7', 'How can I contact support?', 'Go to Settings → Help & Support inside the app.'),
    ],
  },
  {
    id: 'investments',
    name: 'Investments',
    items: [
      faq('inv-1', 'How does AI Stock Analysis work?', 'Broke AI analyzes stock data, market trends, and company fundamentals to generate easy-to-understand insights, helping you evaluate potential investments before you decide.'),
      faq('inv-2', 'Does BrokeNoMore guarantee investment returns?', 'No. All investment insights are for informational purposes only. Markets carry risk, and past performance does not guarantee future returns.'),
      faq('inv-3', 'What financial calculators are available?', 'BrokeNoMore has 6 calculators: SIP, Lumpsum, SWP, FD, PPF, and EMI. Enter your amount, rate, and time period to instantly see your returns, maturity value, or monthly EMI.'),
      faq('inv-4', 'Does BrokeNoMore offer other investment tools?', 'Not yet. For now, AI Stock Analysis is our investment feature. More investment tools are coming soon.'),
      faq('inv-5', 'Can BrokeNoMore recommend a credit card?', 'Yes. Based on your spending habits and financial profile, BrokeNoMore can suggest credit cards that may suit your needs.'),
      faq('inv-6', 'Can I compare loans?', 'Yes. You can compare loan offers side by side based on interest rates, tenure, and other key terms to help you choose the best option.'),
      faq('inv-7', 'Will BrokeNoMore apply for loans or credit cards on my behalf?', 'No. BrokeNoMore only provides recommendations and comparisons. You must apply directly with the respective bank or provider.'),
    ],
  },
  {
    id: 'planning',
    name: 'Financial Planning',
    items: [
      faq('plan-1', 'Can Broke AI help me save more money?', 'Yes. Broke AI reviews your spending patterns and suggests practical ways to cut costs and increase your savings over time.'),
      faq('plan-2', 'Why did AI recommend this budget?', 'Budgets are recommended based on your income and past spending behavior to help you maintain a healthy balance.'),
      faq('plan-3', 'Can I set financial goals?', 'Goals are coming soon. You will be able to create savings goals, track your progress, and get AI-powered plans to reach them.'),
    ],
  },
  {
    id: 'stocks',
    name: 'Stock Analysis',
    items: [
      faq('stock-1', 'What is AI Stock Analysis?', 'Pick any NSE/BSE listed stock, answer a few quick questions, and Broke AI generates a personalized report that explains how the stock fits you.'),
      faq('stock-2', 'Which stocks can I analyze?', 'Search by company name or NSE symbol, or browse popular picks and categories like IT & Tech and Auto & EV.'),
      faq('stock-3', 'Why does it ask me questions before the report?', 'The same stock can suit one person and not another. We ask whether you already own it or are thinking of buying, how much you plan to invest, when you will need the money, and your objective (wealth creation, regular income, value investing, or short-term momentum). Your report is shaped by these answers.'),
      faq('stock-4', 'What does the stock report include?', 'An Investment Snapshot scored on 4 pillars, a Volatility Meter, a Consistency Tracker, Downside Risk shown in rupees for your amount, an AI-generated SWOT analysis, and Ownership Shift showing how promoter and institutional holdings are changing.'),
      faq('stock-5', 'What is the SWOT analysis?', "It is an AI-generated summary of the company's Strengths, Weaknesses, Opportunities, and Threats, written in simple language."),
      faq('stock-6', 'How up to date is the stock data?', 'Stock data is refreshed every morning, and prices are updated with the latest market price when you generate a report.'),
      faq('stock-7', 'Is the report a buy or sell recommendation?', 'No. The report is for educational and informational purposes only. Always do your own research before investing.'),
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    items: [
      faq('port-1', 'How do Offers & Deals work?', 'Offers & Deals showcase curated financial products and discounts that may be relevant to your spending and financial habits.'),
      faq('port-2', 'Are these offers personalized?', 'Yes. Offers are tailored based on your financial profile and activity within the app to ensure relevance.'),
    ],
  },
];
