import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import StructuredData from '@site/src/components/StructuredData';

const faqData = [
  {
    question: "What is ToolJump?",
    answer: "ToolJump is a Knowledge as a Service platform that connects your developer tools (GitHub, AWS, Datadog, CI/CD) to improve developer experience by reducing context switching and providing instant access to related resources."
  },
  {
    question: "How does ToolJump improve developer experience?",
    answer: "ToolJump improves developer experience by connecting tools together, eliminating context switching, providing instant access to related resources, and encoding tribal knowledge into your workflow. This reduces the time spent searching for information from 5-10 minutes to just seconds."
  },
  {
    question: "What is Knowledge as a Service (KaaS)?",
    answer: "Knowledge as a Service (KaaS) is a paradigm that provides dynamic, contextual, and actionable information exactly when and where developers need it. Instead of static documentation or fragmented tribal knowledge, KaaS transforms scattered information into living, contextual guidance."
  },
  {
    question: "How do I start connecting tools with ToolJump?",
    answer: "Start by installing the Chrome extension, then connect your core tools like GitHub, AWS, and monitoring platforms. ToolJump provides step-by-step guides for connecting tools and creating custom integrations. You can begin with our demo mode to see it in action."
  },
  {
    question: "What tools can I connect with ToolJump?",
    answer: "ToolJump can connect GitHub, AWS, GCP, Azure, Datadog, PagerDuty, Terraform, CI/CD pipelines, feature flags, and many other developer tools through its extensible integration framework. You can also create custom integrations for your specific tools."
  },
  {
    question: "Is ToolJump secure and self-hosted?",
    answer: "Yes, ToolJump is designed with security as a core principle. It's self-hosted, meaning you control your data and infrastructure. All data stays within your organization, and secrets are stored locally, never transmitted to external servers."
  },
  {
    question: "How does ToolJump help with connecting tools?",
    answer: "ToolJump helps with connecting tools by providing a unified context bar that follows you across different platforms. It automatically detects what you're working on and shows related information from other tools, eliminating the need to manually search and switch between applications."
  },
  {
    question: "Can I create custom integrations for my specific tools?",
    answer: "Yes, ToolJump is fully extensible. You can write custom integrations in JavaScript and store them in your GitHub repository. The platform provides comprehensive documentation and examples to help you build integrations for any tool in your stack."
  },
  {
    question: "How does ToolJump compare to developer portals?",
    answer: "Unlike developer portals that require engineers to leave their existing tools, ToolJump embeds knowledge directly where you already work. This eliminates the context switching that makes portals ineffective and provides information exactly when and where you need it."
  },
  {
    question: "What's the ROI of implementing ToolJump?",
    answer: "ToolJump delivers measurable returns through faster delivery (20-40% reduction in time spent on non-coding tasks), higher quality code, reduced burnout, better knowledge retention, and faster onboarding of new team members. The time savings multiply across your entire engineering organization."
  }
];

export default function FAQ() {
  return (
    <Layout
      title="FAQ - Connecting Tools with Knowledge as a Service | ToolJump"
      description="Frequently asked questions about ToolJump, Knowledge as a Service, connecting developer tools, and improving developer experience. Get answers to common questions about our platform.">
      <Head>
        <meta name="keywords" content="tooljump faq, knowledge as a service faq, connecting tools faq, developer experience faq, tool integration questions" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ToolJump" />
        <link rel="canonical" href="https://tooljump.dev/faq" />
      </Head>
      <StructuredData type="FAQ" data={{}} />
      
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Frequently Asked Questions</h1>
            <p className="lead">
              Everything you need to know about ToolJump, Knowledge as a Service, 
              and how connecting tools can transform your developer experience.
            </p>
            
            <div className="margin-vert--lg">
              {faqData.map((faq, index) => (
                <div key={index} className="margin-bottom--lg">
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="card margin-vert--lg">
              <div className="card__header">
                <h3>Still have questions?</h3>
              </div>
              <div className="card__body">
                <p>
                  Can't find what you're looking for? We're here to help you get started 
                  with connecting tools and implementing Knowledge as a Service in your organization.
                </p>
                <div className="button-group">
                  <Link
                    className="button button--primary"
                    to="/docs/getting-started">
                    Get Started
                  </Link>
                  <Link
                    className="button button--secondary"
                    to="/docs/implement">
                    Enterprise Implementation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
