import React from 'react';
import type { DataItem } from '../../../extension/src/types';
import Slideshow, { type Slide } from './Slideshow';

const pagerdutyData: DataItem[] = [
    {
      type: 'link',
      content: 'Logs',
      href: '#',
      icon: 'datadog'
    },
    {
      type: 'link',
      content: 'Last deployed code (2h)',
      href: '#',
      status: 'important',
      icon: 'github'
    },
    {
      type: 'link',
      content: 'Recently changed feature flags (2)',
      status: 'important',
      href: '#',
      icon: 'launchdarkly'
    },
];

// GitHub configuration data
const githubData: DataItem[] = [
  {
    type: 'link',
    content: 'Recently changed feature flags (2)',
    href: '#',
    status: 'important',
    icon: 'launchdarkly'
  },
  { 
    type: 'dropdown',
    content: 'Deployment URLs',
    tooltip: 'Access different deployment environments',
    items: [
        { content: 'Dev: http://dev.my.service', href: 'http://dev.my.service', tooltip: 'Development environment for testing' },
        { content: 'QA: http://qa.my.service', href: 'http://qa.my.service', tooltip: 'Quality assurance environment' },
        { content: 'Prod: http://prod.my.service', href: 'http://prod.my.service', status: 'important', tooltip: 'Production environment - use with caution' }
    ]
  },
  {
    type: 'link',
    content: 'Cost 30d: $351',
    href: '#',
    icon: 'cost'
  },
];

// Datadog configuration data
const datadogData: DataItem[] = [
  {
    type: 'link',
    content: 'Last deployed code (2h)',
    href: '#',
    status: 'important',
    icon: 'github'
  },
  {
    type: 'link',
    content: '#service-channel',
    href: '#',
    status: 'none',
    icon: 'slack'
  },
];

// Datadog configuration data
const ldData: DataItem[] = [
  { 
    type: 'text',
    content: 'Code repositories for flags',
    tooltip: 'Access different deployment environments',
    icon: 'github'
  },
];

const SlideshowDemo: React.FC = () => {
  const slides: Slide[] = [
    {
      image: '/img/slide-pagerduty.png',
      data: pagerdutyData,
      alt: 'Pagerduty Screenshot',
      targetSpanIndex: 1, // Target first clickable element: "3 Critical Issues"
      description: 'User checks Pagerduty incident, then they go check the logs',
      url: 'https://pagerduty.com/incidents'
    },
    {
      image: '/img/slide-datadog.png',
      data: datadogData,
      alt: 'Datadog Logs Dashboard Screenshot',
      targetSpanIndex: 1, // Datadog slide has one link; target the first
      description: 'From the Datadog logs, they go and check the last deployed code',
      url: 'https://app.datadoghq.com/logs'
    },
    {
      image: '/img/slide-github-compare.png',
      data: githubData,
      alt: 'GitHub Repository Screenshot',
      targetSpanIndex: 1, // Target first clickable element: "3 Critical Issues"
      description: 'Since the code looks ok, they go check any recently updated feature flags',
      url: 'https://github.com/myorg/myservice/compare/main...staging'
    },
    {
      image: '/img/slide-ld.png',
      data: ldData,
      alt: 'GitHub Repository Screenshot',
      description: 'They find the flags that were recently updated',
      isLastSlide: true, // Mark this as the last slide
      url: 'https://app.launchdarkly.com/default/production/features'
    },
  ];

  return (
    <Slideshow 
      slides={slides} 
      headerText="Example scenario of oncall incident"
      forceWhiteText={true}
      autostart={true}
    />
  );
};

export default SlideshowDemo;
