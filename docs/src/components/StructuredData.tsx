import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'SoftwareApplication' | 'FAQ' | 'BreadcrumbList' | 'Article';
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
          "screenshot": "https://tooljump.dev/img/tooljump.png",
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
            },
            {
              "@type": "Question",
              "name": "What is Knowledge as a Service?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Knowledge as a Service (KaaS) is a paradigm that provides dynamic, contextual, and actionable information exactly when and where developers need it, transforming how engineering teams access and share knowledge across their development ecosystem."
              }
            },
            {
              "@type": "Question",
              "name": "How do I start connecting tools with ToolJump?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Start by installing the Chrome extension, then connect your core tools like GitHub, AWS, and monitoring platforms. ToolJump provides step-by-step guides for connecting tools and creating custom integrations."
              }
            },
            {
              "@type": "Question",
              "name": "What is the best way to connect developer tools?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The best way to connect developer tools is through consistent tagging and naming conventions across all platforms. Use service names as primary identifiers and implement a Knowledge as a Service approach that delivers contextual information directly in your workflow."
              }
            },
            {
              "@type": "Question",
              "name": "How does Knowledge as a Service improve developer experience?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Knowledge as a Service improves developer experience by eliminating context switching, providing real-time contextual information, encoding tribal knowledge, and delivering insights exactly where developers work - directly in their existing tools."
              }
            },
            {
              "@type": "Question",
              "name": "What tools can I connect with ToolJump?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ToolJump can connect GitHub, AWS, GCP, Azure, Datadog, PagerDuty, Terraform, CI/CD pipelines, feature flags, and many other developer tools through its extensible integration framework for comprehensive tool connectivity."
              }
            },
            {
              "@type": "Question",
              "name": "How do I improve developer experience with tool integration?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Improve developer experience by connecting tools to eliminate context switching, implementing Knowledge as a Service for real-time insights, and creating consistent workflows that reduce cognitive load and boost productivity."
              }
            }
          ]
        };
      
      case 'BreadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.breadcrumbs || []
        };
      
      case 'Article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.headline || "ToolJump Documentation",
          "description": data.description || "Learn how to connect your developer tools with ToolJump",
          "author": {
            "@type": "Organization",
            "name": "ToolJump"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ToolJump",
            "logo": {
              "@type": "ImageObject",
              "url": "https://tooljump.dev/img/tooljump.png"
            }
          },
          "datePublished": data.datePublished || new Date().toISOString(),
          "dateModified": data.dateModified || new Date().toISOString(),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || "https://tooljump.dev"
          }
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
