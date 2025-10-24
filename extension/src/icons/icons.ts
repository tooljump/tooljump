import datadog from './datadog.png';
import github from './github.png';
import slack from './slack.png';
import pagerduty from './pagerduty.png';
import circleci from './circleci.png';
import jira from './jira.png';
import confluence from './confluence.png';
import postman from './postman.png';
import link from './link.png';
import cost from './cost.png';
import lambda from './lambda.png';
import aws from './aws.png';
import awsCost from './aws-cost.png';
import launchdarkly from './launchdarkly.png';
import tj from './tj.png';

// Icon map for easier management and iteration
const iconMap = {
    'datadog': datadog,
    'github': github,
    'slack': slack,
    'pagerduty': pagerduty,
    'circleci': circleci,
    'jira': jira,
    'confluence': confluence,
    'postman': postman,
    'link': link,
    'cost': cost,
    'lambda': lambda,
    'aws': aws,
    'aws-cost': awsCost,
    'launchdarkly': launchdarkly,
    'tj': tj,
} as const;

export function getIcon(name: string) {
    return iconMap[name as keyof typeof iconMap] || null;
}

export function getAllIcons() {
    const { tj, ...iconsWithoutTj } = iconMap;
    return iconsWithoutTj;
}

export function getIconNames() {
    return Object.keys(iconMap);
}
