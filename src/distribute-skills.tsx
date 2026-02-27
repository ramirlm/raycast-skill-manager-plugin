import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { loadSkills } from "./utils/skills";
import { AGENT_TARGETS, distributeToTarget, expandHome } from "./utils/agents";
import { usePromise } from "@raycast/utils";

interface DistributeFormValues {
  projectRoot: string;
  targets: string[];
}

function DistributeForm({ onDone }: { onDone: () => void }) {
  const { pop } = useNavigation();
  const { data: skills, isLoading } = usePromise(loadSkills);
  const [rootError, setRootError] = useState<string | undefined>();

  async function handleSubmit(values: DistributeFormValues) {
    const root = expandHome(values.projectRoot.trim());
    if (!root) {
      setRootError("Project root is required");
      return;
    }

    const selectedTargets = AGENT_TARGETS.filter((t) => values.targets.includes(t.id));
    if (selectedTargets.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "Select at least one target" });
      return;
    }

    const toast = await showToast({ style: Toast.Style.Animated, title: "Distributing skills…" });

    const errors: string[] = [];
    for (const target of selectedTargets) {
      try {
        await distributeToTarget(target, root, skills ?? []);
      } catch (err: unknown) {
        errors.push(`${target.label}: ${String(err)}`);
      }
    }

    if (errors.length > 0) {
      await toast.hide();
      await showToast({
        style: Toast.Style.Failure,
        title: "Some targets failed",
        message: errors.join("\n"),
      });
    } else {
      await toast.hide();
      await showToast({
        style: Toast.Style.Success,
        title: "Skills distributed",
        message: `Updated ${selectedTargets.length} file(s) in ${root}`,
      });
      onDone();
      pop();
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Distribute Skills"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Distribute" icon={Icon.Upload} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="projectRoot"
        title="Project Root"
        placeholder="~/projects/my-project"
        defaultValue="~"
        error={rootError}
        onChange={() => setRootError(undefined)}
        info="Absolute or ~ path of the project to distribute skills into."
      />
      <Form.TagPicker id="targets" title="Agent Targets" defaultValue={AGENT_TARGETS.map((t) => t.id)}>
        {AGENT_TARGETS.map((target) => (
          <Form.TagPicker.Item key={target.id} value={target.id} title={target.label} icon={Icon.CodeBlock} />
        ))}
      </Form.TagPicker>
      <Form.Description
        title="What this does"
        text={
          `Skills from your skills.md will be injected into each selected agent configuration file ` +
          `inside the chosen project root. An existing skills block will be replaced; new files will be created.`
        }
      />
      {(skills ?? []).length === 0 && !isLoading && (
        <Form.Description
          title="⚠️  No skills found"
          text="Add some skills first using the 'Add Skill' command."
        />
      )}
    </Form>
  );
}

/**
 * Overview list showing each agent target and its current status.
 * Selecting an item opens the distribute form focused on that target.
 */
export default function DistributeSkills() {
  const { push } = useNavigation();
  const { data: skills, isLoading } = usePromise(loadSkills);
  const [lastDistributed, setLastDistributed] = useState<Date | null>(null);

  const subtitle = lastDistributed
    ? `Last distributed: ${lastDistributed.toLocaleTimeString()}`
    : skills
    ? `${skills.length} skill(s) ready to distribute`
    : "Loading…";

  return (
    <List isLoading={isLoading} navigationTitle="Distribute Skills">
      <List.Section title="Distribution Targets" subtitle={subtitle}>
        {AGENT_TARGETS.map((target) => (
          <List.Item
            key={target.id}
            title={target.label}
            icon={Icon.CodeBlock}
            accessories={[{ icon: Icon.ArrowRight }]}
            actions={
              <ActionPanel>
                <Action
                  title={`Distribute to ${target.label}`}
                  icon={Icon.Upload}
                  onAction={() =>
                    push(<DistributeForm onDone={() => setLastDistributed(new Date())} />)
                  }
                />
                <Action
                  title="Distribute to All Targets"
                  icon={Icon.Globe}
                  shortcut={{ modifiers: ["cmd"], key: "d" }}
                  onAction={() =>
                    push(<DistributeForm onDone={() => setLastDistributed(new Date())} />)
                  }
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Summary">
        <List.Item
          title="Skills ready"
          icon={Icon.Book}
          accessories={[{ text: String((skills ?? []).length) }]}
          actions={
            <ActionPanel>
              <Action
                title="Distribute All Skills"
                icon={Icon.Upload}
                onAction={() => push(<DistributeForm onDone={() => setLastDistributed(new Date())} />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
