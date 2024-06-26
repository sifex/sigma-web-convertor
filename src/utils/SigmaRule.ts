import yaml from 'js-yaml';

export interface LogsourceData {
    category?: string;
    product?: string;
    service?: string;
    definition?: string;
}

export interface SigmaRuleData {
    title: string;
    id?: string;
    status?: Status;
    description?: string;
    references?: string[];
    tags?: string[];
    author?: string;
    date?: string;
    modified?: string;
    logsource: LogsourceData;
    detection: {
        [key: string]: any;
    };
    falsepositives?: string[];
    level?: Level;
    license?: string;
}

export enum Status {
    Experimental = 'experimental',
    Test = 'test',
    Stable = 'stable',
    Deprecated = 'deprecated',
    Unsupported = 'unsupported'
}

export enum Level {
    Informational = 'informational',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical'
}

export class SigmaRule {
    private data: SigmaRuleData;

    constructor(yamlContent: string = '') {
        this.data = {
            title: '',
            logsource: {},
            detection: {}
        };

        if (yamlContent) {
            this.parseYaml(yamlContent);
        }
    }

    parseYaml(content: string) {
        try {
            const parsedYaml = yaml.load(content) as SigmaRuleData;
            this.data = {
                ...parsedYaml,
                logsource: parsedYaml.logsource || {},
                detection: parsedYaml.detection || {}
            };
        } catch (error) {
            console.error('Error parsing YAML:', error);
        }
    }

    generateYaml(): string {
        return yaml.dump(this.data);
    }

    getData(): SigmaRuleData {
        return { ...this.data };
    }

    setData(newData: Partial<SigmaRuleData>) {
        this.data = { ...this.data, ...newData };
    }

    getDetectionYaml(): string {
        return yaml.dump(this.data.detection);
    }

    setDetectionFromYaml(detectionYaml: string) {
        try {
            this.data.detection = yaml.load(detectionYaml) as { [key: string]: any };
        } catch (error) {
            console.error('Error parsing detection YAML:', error);
        }
    }

    setLogsource(logsource: LogsourceData) {
        this.data.logsource = logsource;
    }
}