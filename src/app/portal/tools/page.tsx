import { db } from "@/lib/db";
import SuggestTool from "@/components/SuggestTool";

import ToolSelector from "./ToolSelector";
import { getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Organization not found</p>;

  const allTools = await db.securityTool.findMany({ where: { isActive: true }, orderBy: { category: "asc" } });
  const orgTools = await db.orgSecurityTool.findMany({ where: { orgId: org.id }, select: { toolId: true } });
  const selectedIds = orgTools.map(t => t.toolId);

  // Group by category
  const categories = allTools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof allTools>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Security Stack</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Select the tools your organisation uses. AI scenarios will reference your specific tooling.</p>
      </div>

      {allTools.length === 0 ? (
        <div className="cyber-card text-center py-12">
          <p className="text-3xl mb-3">🔧</p>
          <p className="text-gray-400 text-sm">No security tools configured yet.</p>
          <p className="text-gray-500 text-xs mt-2">Security tools need to be seeded in the database. Contact your admin.</p>
        </div>
      ) : (
        <ToolSelector categories={categories} initialSelected={selectedIds} />
      )}
      <SuggestTool />
    </div>
  );
}
