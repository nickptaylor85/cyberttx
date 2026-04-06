import type { SecurityAlert, ConnectorConfig } from "./index";

/**
 * Fetch alerts from any configured connector
 */
export async function fetchAlerts(config: ConnectorConfig, limit = 20): Promise<SecurityAlert[]> {
  switch (config.type) {
    case "crowdstrike": return fetchCrowdStrike(config, limit);
    case "defender": return fetchDefender(config, limit);
    case "sentinel": return fetchSentinel(config, limit);
    case "taegis": return fetchTaegis(config, limit);
    case "tenable": return fetchTenable(config, limit);
    case "splunk": return fetchSplunk(config, limit);
    case "elastic": return fetchElastic(config, limit);
    case "paloalto": return fetchPaloAlto(config, limit);
    default: return [];
  }
}

// ─── CrowdStrike Falcon ───
async function fetchCrowdStrike(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { clientId, clientSecret, baseUrl = "https://api.crowdstrike.com" } = config.credentials;
  // OAuth2 token
  const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!tokenRes.ok) throw new Error(`CrowdStrike auth failed: ${tokenRes.status}`);
  const { access_token } = await tokenRes.json();

  // Get recent detections
  const detectRes = await fetch(`${baseUrl}/detects/queries/detects/v1?limit=${limit}&sort=last_behavior|desc`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const { resources: detectIds } = await detectRes.json();
  if (!detectIds?.length) return [];

  // Get detection details
  const detailRes = await fetch(`${baseUrl}/detects/entities/summaries/GET/v1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: detectIds }),
  });
  const { resources: detections } = await detailRes.json();

  return (detections || []).map((d: any) => ({
    id: d.detection_id,
    title: d.behaviors?.[0]?.tactic + ": " + (d.behaviors?.[0]?.technique || "Unknown"),
    description: d.behaviors?.[0]?.description || d.behaviors?.[0]?.display_name || "",
    severity: mapSeverity(d.max_severity_displayname),
    source: "CrowdStrike Falcon",
    category: d.behaviors?.[0]?.tactic || "Unknown",
    mitreTechniques: (d.behaviors || []).map((b: any) => b.technique_id).filter(Boolean),
    timestamp: d.last_behavior || d.created_timestamp,
    affectedAssets: [d.device?.hostname, d.device?.local_ip].filter(Boolean),
    status: d.status,
    rawData: d,
  }));
}

// ─── Microsoft Defender XDR ───
async function fetchDefender(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { tenantId, clientId, clientSecret } = config.credentials;
  // Get token
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${clientId}&client_secret=${clientSecret}&scope=https://api.security.microsoft.com/.default&grant_type=client_credentials`,
  });
  const { access_token } = await tokenRes.json();

  const res = await fetch(`https://api.security.microsoft.com/api/incidents?$top=${limit}&$orderby=lastUpdateTime desc`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const { value: incidents } = await res.json();

  return (incidents || []).map((inc: any) => ({
    id: inc.incidentId?.toString(),
    title: inc.incidentName || inc.title,
    description: inc.determination || "",
    severity: mapSeverity(inc.severity),
    source: "Microsoft Defender",
    category: inc.classification || "Unknown",
    mitreTechniques: extractMitreTechniques(inc.incidentName + " " + (inc.determination || "")),
    timestamp: inc.lastUpdateTime || inc.createdTime,
    affectedAssets: (inc.alerts || []).flatMap((a: any) => a.entities?.map((e: any) => e.deviceDnsName || e.userPrincipalName) || []).filter(Boolean),
    status: inc.status,
    rawData: inc,
  }));
}

// ─── Microsoft Sentinel ───
async function fetchSentinel(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { tenantId, clientId, clientSecret, subscriptionId, resourceGroup, workspaceName } = config.credentials;
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${clientId}&client_secret=${clientSecret}&scope=https://management.azure.com/.default&grant_type=client_credentials`,
  });
  const { access_token } = await tokenRes.json();

  const res = await fetch(
    `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspaceName}/providers/Microsoft.SecurityInsights/incidents?api-version=2023-02-01&$top=${limit}&$orderby=properties/createdTimeUtc desc`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const { value: incidents } = await res.json();

  return (incidents || []).map((inc: any) => ({
    id: inc.name,
    title: inc.properties?.title,
    description: inc.properties?.description || "",
    severity: mapSeverity(inc.properties?.severity),
    source: "Microsoft Sentinel",
    category: inc.properties?.classification || "Unknown",
    mitreTechniques: (inc.properties?.additionalData?.tactics || []).flatMap((t: string) => tacticToTechnique(t)),
    timestamp: inc.properties?.createdTimeUtc,
    affectedAssets: [],
    status: inc.properties?.status,
    rawData: inc,
  }));
}

// ─── Secureworks Taegis XDR ───
// Docs: https://docs.taegis.secureworks.com/apis/using_alerts_api/
// Auth: https://docs.taegis.secureworks.com/apis/api_authenticate/
// Regions: US1=api.ctpx, US2=api.delta, US3=api.foxtrot, EU1=api.echo, EU2=api.golf
async function fetchTaegis(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { clientId, clientSecret, region = "US1" } = config.credentials;

  // Map region to API base URL
  const regionUrls: Record<string, string> = {
    "US1": "https://api.ctpx.secureworks.com",
    "US2": "https://api.delta.taegis.secureworks.com",
    "US3": "https://api.foxtrot.taegis.secureworks.com",
    "EU1": "https://api.echo.taegis.secureworks.com",
    "EU2": "https://api.golf.taegis.secureworks.com",
  };
  const apiUrl = regionUrls[region] || regionUrls["US1"];

  // Step 1: OAuth2 token exchange
  // Uses standard client_credentials grant with Taegis auth endpoint
  const tokenRes = await fetch(`${apiUrl}/auth/api/v2/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text().catch(() => "");
    throw new Error(`Taegis auth failed (${tokenRes.status}): ${err}`);
  }
  const { access_token } = await tokenRes.json();
  if (!access_token) throw new Error("Taegis auth: no access_token returned");

  // Step 2: Query alerts using alertsServiceSearch with CQL
  // Docs: https://docs.taegis.secureworks.com/apis/using_alerts_api/
  // CQL: FROM alert WHERE severity >= 0.6 EARLIEST=-7d
  // entities and tags are [String] in the Taegis schema, not objects
  const gqlQuery = `
    query alertsServiceSearch($in: SearchRequestInput!) {
      alertsServiceSearch(in: $in) {
        search_id
        status
        alerts {
          total_results
          list {
            id
            tenant_id
            status
            metadata {
              title
              severity
              description
              created_at { seconds }
              engine { name version }
              creator { detector { detector_id detector_name } }
            }
            entities {
              relationships {
                key
                value
              }
            }
            tags
          }
        }
      }
    }
  `;

  const gqlRes = await fetch(`${apiUrl}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: gqlQuery,
      variables: {
        in: {
          cql_query: "FROM alert WHERE severity >= 0.4 EARLIEST=-7d",
          limit: limit,
          offset: 0,
        },
      },
    }),
  });

  if (!gqlRes.ok) {
    const err = await gqlRes.text().catch(() => "");
    throw new Error(`Taegis GraphQL failed (${gqlRes.status}): ${err}`);
  }

  const { data, errors } = await gqlRes.json();
  if (errors?.length) {
    throw new Error(`Taegis GraphQL error: ${errors[0]?.message || JSON.stringify(errors[0])}`);
  }

  const alerts = data?.alertsServiceSearch?.alerts?.list || [];

  return alerts.map((a: any) => {
    // Tags are [String] in Taegis
    const tagStrings: string[] = Array.isArray(a.tags) ? a.tags : [];
    const mitreTags = tagStrings.filter((t: string) => /T\d{4}/.test(t));

    // Also extract from title patterns
    const titleMitre = extractMitreTechniques(
      (a.metadata?.title || "") + " " + tagStrings.join(" ")
    );

    // entities.entities is [String] formatted as "<type>:<value>"
    // e.g. "hostname:SERVER01", "ip_address:10.0.0.1", "user:jsmith"
    const entityStrings: string[] = a.entities?.entities || [];
    const assets = entityStrings
      .map((e: string) => {
        const parts = e.split(":");
        return parts.length > 1 ? parts.slice(1).join(":") : e;
      })
      .filter(Boolean)
      .slice(0, 10);

    // Map severity (Taegis uses 0.0-1.0 float)
    const sevFloat = a.metadata?.severity || 0;
    const severity = sevFloat >= 0.8 ? "critical" : sevFloat >= 0.6 ? "high" : sevFloat >= 0.4 ? "medium" : "low";

    return {
      id: a.id,
      title: a.metadata?.title || "Taegis Alert",
      description: a.metadata?.description || "",
      severity,
      source: "Taegis XDR",
      category: a.metadata?.creator?.detector?.detector_name || a.metadata?.engine?.name || "Detection",
      mitreTechniques: [...new Set([...mitreTags, ...titleMitre])],
      timestamp: a.metadata?.created_at?.seconds
        ? new Date(a.metadata.created_at.seconds * 1000).toISOString()
        : new Date().toISOString(),
      affectedAssets: assets.slice(0, 10),
      status: a.status || "OPEN",
      rawData: a,
    };
  });
}

// ─── Tenable.io ───
async function fetchTenable(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { accessKey, secretKey } = config.credentials;
  const res = await fetch(`https://cloud.tenable.com/vulns/export`, {
    method: "POST",
    headers: { "X-ApiKeys": `accessKey=${accessKey};secretKey=${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ num_assets: limit, filters: { severity: ["critical", "high"] } }),
  });
  const { export_uuid } = await res.json();
  // Poll for results (simplified)
  await new Promise(r => setTimeout(r, 5000));
  const chunkRes = await fetch(`https://cloud.tenable.com/vulns/export/${export_uuid}/chunks/1`, {
    headers: { "X-ApiKeys": `accessKey=${accessKey};secretKey=${secretKey}` },
  });
  const vulns = await chunkRes.json();

  return (vulns || []).slice(0, limit).map((v: any) => ({
    id: v.plugin?.id?.toString() || Math.random().toString(),
    title: v.plugin?.name || "Vulnerability",
    description: v.plugin?.description || "",
    severity: mapSeverity(v.severity_default_id === 4 ? "critical" : v.severity_default_id === 3 ? "high" : "medium"),
    source: "Tenable",
    category: v.plugin?.family || "Vulnerability",
    mitreTechniques: [],
    timestamp: v.last_found || new Date().toISOString(),
    affectedAssets: [v.asset?.hostname, v.asset?.ipv4].filter(Boolean),
    status: v.state || "open",
    rawData: v,
  }));
}

// ─── Splunk ───
async function fetchSplunk(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { baseUrl, token } = config.credentials;
  const res = await fetch(`${baseUrl}/services/search/jobs/export?output_mode=json&search=${encodeURIComponent(`search index=notable | head ${limit}`)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  const results = text.split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  return results.map((r: any) => ({
    id: r.result?._cd || Math.random().toString(),
    title: r.result?.rule_name || r.result?.search_name || "Notable Event",
    description: r.result?.rule_description || "",
    severity: mapSeverity(r.result?.urgency || r.result?.severity),
    source: "Splunk",
    category: r.result?.rule_title || "Notable",
    mitreTechniques: (r.result?.annotations?.mitre_attack || []).map((t: any) => t.mitre_technique_id).filter(Boolean),
    timestamp: r.result?._time || new Date().toISOString(),
    affectedAssets: [r.result?.dest, r.result?.src].filter(Boolean),
    status: r.result?.status_label || "open",
    rawData: r.result,
  }));
}

// ─── Elastic Security ───
async function fetchElastic(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { baseUrl, apiKey } = config.credentials;
  const res = await fetch(`${baseUrl}/api/detection_engine/signals/search`, {
    method: "POST",
    headers: { Authorization: `ApiKey ${apiKey}`, "Content-Type": "application/json", "kbn-xsrf": "true" },
    body: JSON.stringify({ query: { match_all: {} }, size: limit, sort: [{ "@timestamp": "desc" }] }),
  });
  const { hits } = await res.json();

  return (hits?.hits || []).map((h: any) => ({
    id: h._id,
    title: h._source?.signal?.rule?.name || "Elastic Alert",
    description: h._source?.signal?.rule?.description || "",
    severity: mapSeverity(h._source?.signal?.rule?.severity),
    source: "Elastic Security",
    category: h._source?.signal?.rule?.threat?.[0]?.tactic?.name || "Unknown",
    mitreTechniques: (h._source?.signal?.rule?.threat || []).flatMap((t: any) => t.technique?.map((tech: any) => tech.id) || []),
    timestamp: h._source?.["@timestamp"],
    affectedAssets: [h._source?.host?.name, h._source?.source?.ip].filter(Boolean),
    status: h._source?.signal?.status,
    rawData: h._source,
  }));
}

// ─── Palo Alto Cortex XDR ───
async function fetchPaloAlto(config: ConnectorConfig, limit: number): Promise<SecurityAlert[]> {
  const { apiUrl, apiKeyId, apiKey } = config.credentials;
  const res = await fetch(`${apiUrl}/public_api/v1/incidents/get_incidents`, {
    method: "POST",
    headers: { "x-xdr-auth-id": apiKeyId, Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ request_data: { sort: { field: "creation_time", keyword: "desc" }, search_from: 0, search_to: limit } }),
  });
  const { reply } = await res.json();

  return (reply?.incidents || []).map((inc: any) => ({
    id: inc.incident_id?.toString(),
    title: inc.description || "Cortex XDR Incident",
    description: inc.alert_count + " alerts",
    severity: mapSeverity(inc.severity),
    source: "Cortex XDR",
    category: inc.incident_type || "Unknown",
    mitreTechniques: [],
    timestamp: new Date((inc.creation_time || 0) * 1000).toISOString(),
    affectedAssets: (inc.hosts || []).map((h: string) => h),
    status: inc.status,
    rawData: inc,
  }));
}

// ─── Helpers ───
function mapSeverity(s: string | undefined): "critical" | "high" | "medium" | "low" {
  if (!s) return "medium";
  const l = s.toLowerCase();
  if (l.includes("critical") || l === "4") return "critical";
  if (l.includes("high") || l === "3") return "high";
  if (l.includes("low") || l === "1" || l.includes("informational")) return "low";
  return "medium";
}

function extractMitreTechniques(text: string): string[] {
  const matches = text.match(/T\d{4}(\.\d{3})?/g);
  return [...new Set(matches || [])];
}

function tacticToTechnique(tactic: string): string[] {
  const map: Record<string, string[]> = {
    "InitialAccess": ["T1190", "T1566"], "Execution": ["T1059", "T1053"],
    "Persistence": ["T1547", "T1053"], "PrivilegeEscalation": ["T1548", "T1134"],
    "DefenseEvasion": ["T1027", "T1070"], "CredentialAccess": ["T1003", "T1110"],
    "Discovery": ["T1082", "T1083"], "LateralMovement": ["T1021", "T1570"],
    "Collection": ["T1005", "T1074"], "Exfiltration": ["T1041", "T1567"],
    "Impact": ["T1486", "T1489"], "CommandAndControl": ["T1071", "T1105"],
  };
  return map[tactic] || [];
}
