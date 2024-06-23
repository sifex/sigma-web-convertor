export interface Logsource {
    category?: string;
    product?: string;
    service?: string;
    description: string;
}

export const logsources: Logsource[] = [
    {
        product: 'windows',
        service: 'security',
        description: 'Windows Security Event Log'
    },
    {
        product: 'windows',
        service: 'sysmon',
        description: 'Sysmon Event Log'
    },
    {
        product: 'linux',
        service: 'auth',
        description: 'Linux Authentication Logs'
    },
    {
        product: 'apache',
        service: 'accesslog',
        description: 'Apache Access Logs'
    },
    {
        category: 'process_creation',
        product: 'windows',
        description: 'Windows Process Creation Events'
    },
    {
        category: 'network_connection',
        description: 'Generic Network Connection Events'
    },
    // Add more logsources as needed
];