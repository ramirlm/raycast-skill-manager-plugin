import { Action, ActionPanel, Color, Icon, List, showToast, Toast } from "@raycast/api";
import { useMemo, useState } from "react";
import { usePromise } from "@raycast/utils";
import {
  AgentSkillsSyncStatus,
  detectAgentSkillsTargets,
  getAgentSkillsSyncStatus,
  getCentralSkillsPath,
  importMissingSkillsFromAgents,
  listSkillFolders,
  syncSelectedSkillsToAgents,
} from "./utils/central-skills";
import { loadSkills } from "./utils/skills";

interface SyncOverviewData {
  centralPath: string;
  centralSkillNames: string[];
  statuses: AgentSkillsSyncStatus[];
  tagsCount: Array<{ tag: string; count: number }>;
  autoImported: number;
}

async function loadSyncOverview(): Promise<SyncOverviewData> {
  const bootstrap = await importMissingSkillsFromAgents();
  const centralPath = getCentralSkillsPath();
  const centralSkills = (await listSkillFolders(centralPath)).filter((skill) => skill.hasSkillMd);
  const targets = await detectAgentSkillsTargets();
  const statuses = await getAgentSkillsSyncStatus(targets);
  const skills = await loadSkills({ autoImportFromAgents: false });
  const tagMap = skills.reduce((map, skill) => {
    for (const tag of skill.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
    return map;
  }, new Map<string, number>());
  const tagsCount = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    centralPath,
    centralSkillNames: centralSkills.map((skill) => skill.name).sort((a, b) => a.localeCompare(b)),
    statuses,
    tagsCount,
    autoImported: bootstrap.imported,
  };
}

function containsSkillName(collection: string[], skillName: string): boolean {
  return collection.some((name) => name.toLowerCase() === skillName.toLowerCase());
}

function formatSkillList(title: string, items: string[]): string {
  if (items.length === 0) {
    return `### ${title}\n\n- None\n`;
  }
  return `### ${title}\n\n${items.map((item) => `- ${item}`).join("\n")}\n`;
}

export default function SyncSkills() {
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading, revalidate: refresh } = usePromise(async () => loadSyncOverview(), []);

  const installedStatuses = useMemo(
    () => (data?.statuses ?? []).filter((status) => status.target.installed),
    [data?.statuses],
  );

  const coverageBySkill = useMemo(() => {
    const map = new Map<string, number>();
    for (const status of installedStatuses) {
      for (const skillName of status.syncedSkillNames) {
        const key = skillName.toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [installedStatuses]);

  async function syncSkills(skillNames: string[], statuses: AgentSkillsSyncStatus[], title: string) {
    if (!data) return;
    if (skillNames.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No skills to sync" });
      return;
    }

    const targets = statuses.map((status) => status.target);
    if (targets.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No installed agents detected" });
      return;
    }

    setIsSyncing(true);
    const toast = await showToast({ style: Toast.Style.Animated, title });
    try {
      const result = await syncSelectedSkillsToAgents(skillNames, targets);
      await toast.hide();
      await showToast({
        style: result.errors.length > 0 ? Toast.Style.Failure : Toast.Style.Success,
        title: "Sync complete",
        message: `${result.linked} links updated, ${result.skipped} skipped`,
      });
      await refresh();
    } catch (err) {
      await toast.hide();
      await showToast({
        style: Toast.Style.Failure,
        title: "Sync failed",
        message: String(err),
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleImportMissing() {
    setIsSyncing(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Importing missing skills from agents..." });
    try {
      const result = await importMissingSkillsFromAgents();
      await toast.hide();
      await showToast({
        style: result.errors.length > 0 ? Toast.Style.Failure : Toast.Style.Success,
        title: "Import complete",
        message: `${result.imported} imported from ${result.scanned} scanned`,
      });
      await refresh();
    } catch (err) {
      await toast.hide();
      await showToast({ style: Toast.Style.Failure, title: "Import failed", message: String(err) });
    } finally {
      setIsSyncing(false);
    }
  }

  const totalInstalledAgents = installedStatuses.length;
  const totalMissing = installedStatuses.reduce((sum, status) => sum + status.missingFromAgent, 0);
  const totalExtra = installedStatuses.reduce((sum, status) => sum + status.extraInAgent, 0);

  return (
    <List
      isLoading={isLoading || isSyncing}
      navigationTitle="Sync Skills"
      searchBarPlaceholder="Search agents, skills, or tags..."
      isShowingDetail
    >
      <List.Section title="Overview">
        <List.Item
          title="Central Skills Repository"
          subtitle={data?.centralPath}
          icon={Icon.Folder}
          accessories={[{ text: String(data?.centralSkillNames.length ?? 0) }]}
          detail={
            <List.Item.Detail
              markdown={
                `## Central Repository\n\n- Path: \`${data?.centralPath ?? "-"}\`\n` +
                `- Skills in central: ${data?.centralSkillNames.length ?? 0}\n` +
                `- Installed agents: ${totalInstalledAgents}\n` +
                `- Missing links: ${totalMissing}\n` +
                `- Extra agent skills: ${totalExtra}\n` +
                `- Auto-imported this refresh: ${data?.autoImported ?? 0}\n`
              }
            />
          }
          actions={
            <ActionPanel>
              <Action
                title="Sync All Skills to Installed Agents"
                icon={Icon.ArrowClockwise}
                onAction={() =>
                  syncSkills(data?.centralSkillNames ?? [], installedStatuses, "Syncing all central skills...")
                }
              />
              <Action title="Import Missing Skills from Agents" icon={Icon.Download} onAction={handleImportMissing} />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={refresh}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Agents">
        {(data?.statuses ?? [])
          .slice()
          .sort((a, b) => a.target.label.localeCompare(b.target.label))
          .map((status) => {
            const unsynced = status.missingFromAgent + status.extraInAgent;
            return (
              <List.Item
                key={status.target.id}
                title={status.target.label}
                subtitle={status.target.skillsPath}
                icon={status.target.installed ? Icon.CheckCircle : Icon.XmarkCircle}
                accessories={[
                  {
                    tag: {
                      value: status.target.installed ? "Installed" : "Not Installed",
                      color: status.target.installed ? Color.Green : Color.Red,
                    },
                  },
                  { text: `Central ${status.centralSkills}` },
                  { text: `Synced ${status.syncedFromCentral}` },
                  { text: `Unsynced ${unsynced}` },
                ]}
                detail={
                  <List.Item.Detail
                    markdown={
                      `## ${status.target.label}\n\n` +
                      `- Skills path: \`${status.target.skillsPath}\`\n` +
                      `- Central skills: ${status.centralSkills}\n` +
                      `- Agent skills: ${status.agentSkills}\n` +
                      `- Synced from central: ${status.syncedFromCentral}\n` +
                      `- Missing in agent: ${status.missingFromAgent}\n` +
                      `- Extra in agent: ${status.extraInAgent}\n\n` +
                      formatSkillList("Missing Skills", status.missingSkillNames) +
                      "\n" +
                      formatSkillList("Extra Skills", status.extraSkillNames)
                    }
                  />
                }
                actions={
                  <ActionPanel>
                    {status.target.installed ? (
                      <Action
                        title={`Sync All to ${status.target.label}`}
                        icon={Icon.ArrowClockwise}
                        onAction={() =>
                          syncSkills(
                            data?.centralSkillNames ?? [],
                            [status],
                            `Syncing all skills to ${status.target.label}...`,
                          )
                        }
                      />
                    ) : null}
                    {status.target.installed && status.missingSkillNames.length > 0 ? (
                      <Action
                        title={`Sync Missing to ${status.target.label}`}
                        icon={Icon.Link}
                        onAction={() =>
                          syncSkills(
                            status.missingSkillNames,
                            [status],
                            `Syncing missing skills to ${status.target.label}...`,
                          )
                        }
                      />
                    ) : null}
                    <Action
                      title="Import Missing Skills from Agents"
                      icon={Icon.Download}
                      onAction={handleImportMissing}
                    />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={refresh}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>

      <List.Section title="Domains (Tags)">
        {(data?.tagsCount ?? []).length === 0 ? (
          <List.Item title="No tags found" icon={Icon.Tag} />
        ) : (
          (data?.tagsCount ?? []).map((tag) => (
            <List.Item
              key={tag.tag}
              title={tag.tag}
              icon={Icon.Tag}
              accessories={[{ text: String(tag.count) }]}
              actions={
                <ActionPanel>
                  <Action
                    title="Import Missing Skills from Agents"
                    icon={Icon.Download}
                    onAction={handleImportMissing}
                  />
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={refresh}
                  />
                </ActionPanel>
              }
            />
          ))
        )}
      </List.Section>

      <List.Section title="Central Skills">
        {(data?.centralSkillNames ?? []).map((skillName) => {
          const coverage = coverageBySkill.get(skillName.toLowerCase()) ?? 0;
          const missingStatuses = installedStatuses.filter((status) =>
            containsSkillName(status.missingSkillNames, skillName),
          );
          const missingTargets = missingStatuses.map((status) => status.target.label);

          return (
            <List.Item
              key={skillName}
              title={skillName}
              icon={Icon.Book}
              accessories={[{ text: `${coverage}/${totalInstalledAgents} synced` }]}
              detail={
                <List.Item.Detail
                  markdown={
                    `## ${skillName}\n\n` +
                    `- Synced in installed agents: ${coverage}/${totalInstalledAgents}\n` +
                    formatSkillList("Missing Targets", missingTargets)
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action
                    title="Sync Skill to All Installed Agents"
                    icon={Icon.ArrowClockwise}
                    onAction={() =>
                      syncSkills([skillName], installedStatuses, `Syncing ${skillName} to all installed agents...`)
                    }
                  />
                  {missingStatuses.length > 0 ? (
                    <Action
                      title="Sync Skill to Missing Agents"
                      icon={Icon.Link}
                      onAction={() =>
                        syncSkills([skillName], missingStatuses, `Syncing ${skillName} to missing agents...`)
                      }
                    />
                  ) : null}
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={refresh}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
