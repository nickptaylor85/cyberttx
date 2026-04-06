/**
 * SIEM/XDR Connector Framework
 * Pulls real alerts from security tools to seed exercise scenarios
 */

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;            // Which tool
  category: string;          // e.g. "Malware", "Phishing", "Lateral Movement"
  mitreTechniques: string[]; // e.g. ["T1566", "T1059"]
  timestamp: string;
  rawData?: any;             // Original alert payload
  affectedAssets?: string[]; // Hostnames, IPs, users
  status?: string;           // Open, Investigating, Resolved
}

export interface ConnectorConfig {
  type: string;
  name: string;
  credentials: Record<string, string>;
  enabled: boolean;
  lastSyncAt?: string;
}

export const SUPPORTED_CONNECTORS = [
  {
    type: "taegis",
    name: "Secureworks Taegis XDR",
    icon: "🛡️",
    description: "Pull detections and alerts from Taegis XDR via GraphQL API",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "Taegis API client ID (from Tenant Settings → Manage API Credentials)", secret: false },
      { key: "clientSecret", label: "Client Secret", placeholder: "Taegis API client secret (shown once on creation)", secret: true },
      { key: "region", label: "Region", placeholder: "US1, US2, US3, EU1, or EU2", secret: false },
    ],
    docsUrl: "https://docs.taegis.secureworks.com/apis/api_authenticate/",
  },
  {
    type: "crowdstrike",
    name: "CrowdStrike Falcon",
    icon: "🦅",
    description: "Pull detections and incidents from Falcon platform",
    fields: [
      { key: "clientId", label: "API Client ID", placeholder: "CrowdStrike OAuth2 client ID", secret: false },
      { key: "clientSecret", label: "API Client Secret", placeholder: "CrowdStrike OAuth2 client secret", secret: true },
      { key: "baseUrl", label: "Base URL", placeholder: "https://api.crowdstrike.com", secret: false },
    ],
    docsUrl: "https://falcon.crowdstrike.com/documentation/",
  },
  {
    type: "defender",
    name: "Microsoft Defender XDR",
    icon: "🔷",
    description: "Pull incidents and alerts from Microsoft 365 Defender",
    fields: [
      { key: "tenantId", label: "Tenant ID", placeholder: "Azure AD tenant ID", secret: false },
      { key: "clientId", label: "App Registration Client ID", placeholder: "App registration client ID", secret: false },
      { key: "clientSecret", label: "Client Secret", placeholder: "App registration client secret", secret: true },
    ],
    docsUrl: "https://learn.microsoft.com/en-us/microsoft-365/security/defender/api-overview",
  },
  {
    type: "sentinel",
    name: "Microsoft Sentinel",
    icon: "🔵",
    description: "Pull incidents from Sentinel SIEM",
    fields: [
      { key: "tenantId", label: "Tenant ID", placeholder: "Azure AD tenant ID", secret: false },
      { key: "clientId", label: "App Registration Client ID", placeholder: "App registration client ID", secret: false },
      { key: "clientSecret", label: "Client Secret", placeholder: "App registration client secret", secret: true },
      { key: "subscriptionId", label: "Subscription ID", placeholder: "Azure subscription ID", secret: false },
      { key: "resourceGroup", label: "Resource Group", placeholder: "Sentinel resource group", secret: false },
      { key: "workspaceName", label: "Workspace Name", placeholder: "Log Analytics workspace name", secret: false },
    ],
    docsUrl: "https://learn.microsoft.com/en-us/rest/api/securityinsights/",
  },
  {
    type: "tenable",
    name: "Tenable.io / Nessus",
    icon: "🔍",
    description: "Pull vulnerability findings and alerts",
    fields: [
      { key: "accessKey", label: "Access Key", placeholder: "Tenable.io API access key", secret: false },
      { key: "secretKey", label: "Secret Key", placeholder: "Tenable.io API secret key", secret: true },
    ],
    docsUrl: "https://developer.tenable.com/",
  },
  {
    type: "splunk",
    name: "Splunk Enterprise / Cloud",
    icon: "🟢",
    description: "Pull notable events from Splunk ES",
    fields: [
      { key: "baseUrl", label: "Splunk URL", placeholder: "https://splunk.company.com:8089", secret: false },
      { key: "token", label: "Bearer Token", placeholder: "Splunk authentication token", secret: true },
    ],
    docsUrl: "https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/",
  },
  {
    type: "elastic",
    name: "Elastic Security",
    icon: "🟡",
    description: "Pull alerts and detections from Elastic SIEM",
    fields: [
      { key: "baseUrl", label: "Kibana URL", placeholder: "https://kibana.company.com:5601", secret: false },
      { key: "apiKey", label: "API Key", placeholder: "Elastic API key", secret: true },
    ],
    docsUrl: "https://www.elastic.co/guide/en/security/current/api-overview.html",
  },
  {
    type: "paloalto",
    name: "Palo Alto Cortex XDR",
    icon: "🔶",
    description: "Pull incidents and alerts from Cortex XDR",
    fields: [
      { key: "apiUrl", label: "API URL", placeholder: "https://api-{fqdn}.xdr.{region}.paloaltonetworks.com", secret: false },
      { key: "apiKeyId", label: "API Key ID", placeholder: "Cortex XDR API key ID", secret: false },
      { key: "apiKey", label: "API Key", placeholder: "Cortex XDR advanced API key", secret: true },
    ],
    docsUrl: "https://docs-cortex.paloaltonetworks.com/",
  },
];
