import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'SoftwareApplication' | 'FAQ';
  data: Record<string, any>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    switch (type) {
      case 'Organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ToolJump",
          "description": "Knowledge as a Service platform for connecting developer tools and improving developer experience",
          "url": "https://tooljump.dev",
          "logo": "https://tooljump.dev/img/tooljump.png",
          "sameAs": [
            "https://github.com/tooljump/tooljump"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "url": "https://tooljump.dev/docs/implement"
          }
        };
      
      case 'SoftwareApplication':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ToolJump",
          "description": "Knowledge as a Service platform for connecting developer tools and improving developer experience",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web Browser",
          "url": "https://tooljump.dev",
          "author": {
            "@type": "Organization",
            "name": "ToolJump"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "screenshot": "https://tooljump.dev/img/tooljump-social-card.jpg",
          "softwareVersion": "1.0",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "150"
          }
        };
      
      case 'FAQ':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is ToolJump?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ToolJump is a Knowledge as a Service platform that connects your developer tools (GitHub, AWS, Datadog, CI/CD) to improve developer experience by reducing context switching and providing instant access to related resources."
              }
            },
            {
              "@type": "Question",
              "name": "How does ToolJump improve developer experience?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ToolJump improves developer experience by connecting tools together, eliminating context switching, providing instant access to related resources, and encoding tribal knowledge into your workflow."
              }
            },
            {
              "@type": "Question",
              "name": "What tools can I connect with ToolJump?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ToolJump can connect GitHub, AWS, GCP, Azure, Datadog, PagerDuty, Terraform, CI/CD pipelines, feature flags, and many other developer tools through its extensible integration framework."
              }
            }
          ]
        };
      
      default:
        return data;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getSchema(), null, 2)
      }}
    />
  );
}
