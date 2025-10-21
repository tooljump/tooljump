import { Collector, SiteAdapter } from '../types';
import { waitFor } from '../../utils/utils';
import { AWSAccountCollector } from './collectors/account';
import { AWSRegionCollector } from './collectors/region';
import { AWSLambdaCollector } from './collectors/lambda';
import { AWSDynamoDBCollector } from './collectors/dynamodb';
import { AWSS3Collector } from './collectors/s3';


// AWS Adapter that combines injection, styling, and collectors
export class AWSAdapter implements SiteAdapter {
  getDescription(): string {
    return 'AWS adapter, collecting information about Lambda, DynamoDB, S3, and more';
  }

  async matches(): Promise<boolean> {
    return window.location.hostname.endsWith('console.aws.amazon.com');
  }

  async inject(container: HTMLElement): Promise<void> {
    const nav = await waitFor(() => {
      // some pages have role=navigation, some have role=presentation
      const n = document.querySelector('nav[role=navigation]');
      const p = document.querySelector('nav[role=presentation]');
      return n || p;
    }, 5000) || null;

    if (!nav || !nav?.parentElement?.parentElement) {
      return;
    }

    const parent = nav.parentElement.parentElement;
    parent.appendChild(container);
    nav.parentElement.style.blockSize = '50%';
    parent.style.blockSize = '82px';
    parent.style.flexDirection = 'column';
  }

  getStyle(): React.CSSProperties {
    return {
      position: 'static',
      display: 'block',
      borderTop: '1px solid rgb(231, 231, 231)',
      background: '#f8f8f8',
      marginLeft: '-16px',
      /* AWS console has a complex header structure, so we use fixed positioning */
      /* Ensure it's above AWS console elements */
      zIndex: 99999,
      /* AWS specific adjustments */
      borderRadius: 0,
      /* Add some spacing to account for AWS console header */
      marginTop: 0,
    };
  }

  getContextType(): string {
    return 'aws';
  }

  getCollectors(): Collector[] {
    return [
      new AWSAccountCollector(),
      new AWSRegionCollector(),
      new AWSLambdaCollector(),
      new AWSDynamoDBCollector(),
      new AWSS3Collector(),
    ];
  }
} 