import { useEffect, useMemo, useState } from "react";
import {
  Button,
  CircleCheckInstUIIcon,
  CloseButton,
  DateInput,
  Heading,
  Modal,
  ProgressBar,
  ScreenReaderContent,
  SimpleSelect,
  Table,
  Text,
  TextInput,
} from "@instructure/ui/v11_7";
import FigmaAlert from "./FigmaAlert";
import StatusPill from "./StatusPill";
import { useSurfaceTokens } from "./appTheme";
import {
  AREA_TO_TYPE,
  BROKEN_LINKS,
  COPIED_COUNTS,
  DEADLINES,
  DECISION_LABEL,
  FAILED_ITEMS,
  LINK_ACTION_LABEL,
  NEW_TERM_START,
  OLD_TERM_START,
  addDays,
  checkDate,
  daysBetween,
  fmtDate,
  parseDate,
} from "./rolloverData";
import type { CopySummary, Decision, EducatorComment, LinkAction } from "./rolloverData";

// The copy wizard. It opens when someone starts a copy, so the review happens before the copy
// (discovery priority 1), not after it. Each step has a name that says what it covers:
//   Review comments  what the last teaching team flagged
//   Fix dates        deadlines for the new term, with a preview and warnings (priority 7)
//   Fix links        broken links and tools (priority 3)
//   Summary          what came over and what didn't (priority 2)
// Sample data only.

const noFill = { background: "transparent" };

const dateFieldProps = {
  screenReaderLabels: {
    calendarIcon: "Open calendar",
    prevMonthButton: "Previous month",
    nextMonthButton: "Next month",
    datePickerDialog: "Date picker",
    selectedLabel: "Selected",
  },
  placeholder: "Select a date",
  invalidDateErrorMessage: "Enter a valid date",
};

type StepId = "comments" | "dates" | "links" | "summary";
const STEP_INFO: Record<StepId, { name: string; hint: string; lead: string }> =
  {
    comments: {
      name: "Review comments",
      hint: "What your team flagged",
      lead: "The team that taught this course last term left these comments. Decide what to do with each item before it is copied.",
    },
    dates: {
      name: "Fix dates",
      hint: "Deadlines for the new term",
      lead: "Move every deadline to the new term. Check the preview and fix anything flagged before you copy.",
    },
    links: {
      name: "Fix links",
      hint: "Broken links and tools",
      lead: "These links broke or point to the old course. Choose how to handle each one.",
    },
    summary: {
      name: "Summary",
      hint: "What came over",
      lead: "Here is what came over and what did not.",
    },
  };

// ---- Confirmation before replacing a copy -----------------------------------------------------------------
export function ReplaceConfirm({
  open,
  source,
  copiedOn,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  source: string;
  copiedOn: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onDismiss={onCancel}
      size="small"
      label="Replace the copied content"
      shouldCloseOnDocumentClick={false}
    >
      <Modal.Header>
        <CloseButton
          placement="end"
          offset="small"
          onClick={onCancel}
          screenReaderLabel="Close"
        />
        <Heading level="h2">Replace the copied content?</Heading>
      </Modal.Header>
      <Modal.Body>
        <Text as="p">
          This course already has content copied from{" "}
          <Text weight="bold">{source}</Text> on {copiedOn}. Copying again
          replaces that content. Content you added by hand stays.
        </Text>
        <Text as="p">Do you want to replace it?</Text>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button color="danger" onClick={onConfirm}>
            Yes, replace it
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

// ---- Step indicator -----------------------------------------------------------------------------------------
function Stepper({
  steps,
  current,
  reached,
  onGo,
}: {
  steps: StepId[];
  current: number;
  reached: number;
  onGo: (i: number) => void;
}) {
  const t = useSurfaceTokens();
  return (
    <ol
      aria-label="Copy steps"
      style={{
        display: "flex",
        gap: t.space.lg,
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {steps.map((id, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const color = isCurrent
          ? t.linkColor
          : done
            ? t.successTextColor
            : t.mutedTextColor;
        return (
          <li
            key={id}
            aria-current={isCurrent ? "step" : undefined}
            style={{ flex: 1, minWidth: 0 }}
          >
            <button
              type="button"
              className="wizard-step"
              disabled={i > reached || id === "summary"}
              onClick={() => onGo(i)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                width: "100%",
                display: "flex",
                gap: t.space.sm,
                alignItems: "flex-start",
                cursor: i > reached || id === "summary" ? "default" : "pointer",
                paddingTop: t.space.sm,
                borderTop: `0.25rem solid ${isCurrent ? t.linkColor : done ? t.successTextColor : t.borderColor}`,
                color: t.textColor,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: "1.5rem",
                  height: "1.5rem",
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  border: done ? "none" : `0.125rem solid ${color}`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                }}
              >
                {done ? <CircleCheckInstUIIcon /> : i + 1}
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <Text weight={isCurrent ? "bold" : "normal"}>
                  {STEP_INFO[id].name}
                </Text>
                <Text size="small" color="secondary">
                  {STEP_INFO[id].hint}
                </Text>
                <ScreenReaderContent>
                  {done ? "Done" : isCurrent ? "Current step" : ""}
                </ScreenReaderContent>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---- Step 1: educator comments -------------------------------------------------------------------------------
function CommentsStep({
  course,
  comments,
  decisions,
  onDecide,
}: {
  course: string;
  comments: EducatorComment[];
  decisions: Record<string, Decision>;
  onDecide: (id: string, d: Decision) => void;
}) {
  const t = useSurfaceTokens();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.lg }}>
      <Text as="p">
        {comments.length} comments from {course}, Fall 2025. We suggested a
        choice for each one from the wording. Change it if you disagree.
      </Text>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: t.space.lg,
        }}
      >
        {comments.map((c) => (
          <li
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 15rem",
              gap: t.space.xl,
              alignItems: "start",
              padding: t.space.lg,
              background: t.containerColor,
              border: `${t.borderWidth} solid ${t.borderColor}`,
              borderRadius: t.radiusMd,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: t.space.sm,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: t.space.sm,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <StatusPill size="sm">{c.area}</StatusPill>
                <Text weight="bold">{c.item}</Text>
              </div>
              <Text as="p">“{c.text}”</Text>
              <Text size="small" color="secondary">
                {c.author}, {c.term}
              </Text>
            </div>
            <SimpleSelect
              renderLabel={`What to do with ${c.item}`}
              value={decisions[c.id]}
              onChange={(_e, { value }) => onDecide(c.id, value as Decision)}
            >
              {(Object.keys(DECISION_LABEL) as Decision[]).map((d) => (
                <SimpleSelect.Option key={d} id={`${c.id}-${d}`} value={d}>
                  {DECISION_LABEL[d]}
                </SimpleSelect.Option>
              ))}
            </SimpleSelect>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Step 2: dates -------------------------------------------------------------------------------------------
type DateRow = { id: string; text: string };

function DatesStep({
  rows,
  setRows,
}: {
  rows: DateRow[];
  setRows: (r: DateRow[]) => void;
}) {
  const t = useSurfaceTokens();
  const [termStart, setTermStart] = useState(fmtDate(NEW_TERM_START));
  const flagged = rows.filter((r) => checkDate(parseDate(r.text))).length;
  const shift = () => {
    const start = parseDate(termStart);
    if (!start) return;
    const offset = daysBetween(OLD_TERM_START, start);
    setRows(
      DEADLINES.map((dl) => ({
        id: dl.id,
        text: fmtDate(addDays(dl.old, offset)),
      })),
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xl }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: t.gapInputs,
          flexWrap: "wrap",
        }}
      >
        <DateInput
          {...dateFieldProps}
          width="13rem"
          renderLabel="New term starts on"
          value={termStart}
          onChange={(_e, inputValue) => setTermStart(inputValue)}
        />
        <Button onClick={shift}>Shift all dates to this term</Button>
        <Text size="small" color="secondary">
          Last term started on {fmtDate(OLD_TERM_START)}. Shifting by whole
          weeks keeps each deadline on the same weekday.
        </Text>
      </div>
      {flagged > 0 ? (
        <FigmaAlert variant="warning" type="inline">
          {flagged} {flagged === 1 ? "date needs" : "dates need"} a look. Fix{" "}
          {flagged === 1 ? "it" : "them"} here, or copy anyway and fix{" "}
          {flagged === 1 ? "it" : "them"} later.
        </FigmaAlert>
      ) : (
        <FigmaAlert variant="success" type="inline">
          All dates fall on a school day inside the new term.
        </FigmaAlert>
      )}
      <Table
        caption={() => "Deadlines for the new term"}
        themeOverride={noFill}
      >
        <Table.Head themeOverride={noFill}>
          <Table.Row themeOverride={noFill}>
            <Table.ColHeader themeOverride={noFill} id="dl">
              Deadline
            </Table.ColHeader>
            <Table.ColHeader themeOverride={noFill} id="old">
              Last term
            </Table.ColHeader>
            <Table.ColHeader themeOverride={noFill} id="new">
              New date
            </Table.ColHeader>
            <Table.ColHeader themeOverride={noFill} id="chk">
              Check
            </Table.ColHeader>
          </Table.Row>
        </Table.Head>
        <Table.Body themeOverride={noFill}>
          {DEADLINES.map((dl) => {
            const row = rows.find((r) => r.id === dl.id)!;
            const problem = checkDate(parseDate(row.text));
            return (
              <Table.Row themeOverride={noFill} key={dl.id}>
                <Table.Cell themeOverride={noFill}>
                  <Text weight="bold">{dl.title}</Text>
                  <div>
                    <Text size="small" color="secondary">
                      {dl.kind}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell themeOverride={noFill}>
                  {fmtDate(dl.old)}
                </Table.Cell>
                <Table.Cell themeOverride={noFill}>
                  <DateInput
                    {...dateFieldProps}
                    width="11rem"
                    renderLabel={
                      <ScreenReaderContent>
                        New date for {dl.title}
                      </ScreenReaderContent>
                    }
                    value={row.text}
                    onChange={(_e, inputValue) =>
                      setRows(
                        rows.map((r) =>
                          r.id === dl.id ? { ...r, text: inputValue } : r,
                        ),
                      )
                    }
                  />
                </Table.Cell>
                <Table.Cell themeOverride={noFill}>
                  {problem ? (
                    <StatusPill color="warning">{problem}</StatusPill>
                  ) : (
                    <StatusPill color="success">OK</StatusPill>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}

// ---- Step 3: links -------------------------------------------------------------------------------------------
type LinkState = Record<string, { action: LinkAction; url: string }>;

function LinksStep({
  links,
  setLinks,
}: {
  links: LinkState;
  setLinks: (l: LinkState) => void;
}) {
  const t = useSurfaceTokens();
  const fixable = BROKEN_LINKS.filter((l) => l.suggestion);
  const set = (id: string, patch: Partial<LinkState[string]>) =>
    setLinks({ ...links, [id]: { ...links[id], ...patch } });
  const fixAll = () => {
    const next = { ...links };
    for (const l of fixable) next[l.id] = { action: "fix", url: l.suggestion! };
    setLinks(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xl }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: t.space.lg,
          flexWrap: "wrap",
        }}
      >
        <Text>{BROKEN_LINKS.length} links need attention.</Text>
        <Button onClick={fixAll}>
          Fix the {fixable.length} links that point to the old course
        </Button>
      </div>
      <Table caption={() => "Broken links"} themeOverride={noFill}>
        <Table.Head themeOverride={noFill}>
          <Table.Row themeOverride={noFill}>
            <Table.ColHeader themeOverride={noFill} id="link">
              Link
            </Table.ColHeader>
            <Table.ColHeader themeOverride={noFill} id="problem">
              Problem
            </Table.ColHeader>
            <Table.ColHeader themeOverride={noFill} id="what">
              What to do
            </Table.ColHeader>
          </Table.Row>
        </Table.Head>
        <Table.Body themeOverride={noFill}>
          {BROKEN_LINKS.map((l) => (
            <Table.Row themeOverride={noFill} key={l.id}>
              <Table.Cell themeOverride={noFill}>
                <Text weight="bold">{l.label}</Text>
                <div>
                  <Text size="small" color="secondary">
                    In {l.where}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell themeOverride={noFill}>
                <StatusPill color={l.kind === "tool" ? "warning" : "error"}>
                  {l.problem}
                </StatusPill>
              </Table.Cell>
              <Table.Cell themeOverride={noFill}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: t.space.sm,
                    minWidth: "16rem",
                  }}
                >
                  <SimpleSelect
                    renderLabel={
                      <ScreenReaderContent>
                        What to do with {l.label}
                      </ScreenReaderContent>
                    }
                    value={links[l.id].action}
                    onChange={(_e, { value }) =>
                      set(l.id, { action: value as LinkAction })
                    }
                  >
                    {(Object.keys(LINK_ACTION_LABEL) as LinkAction[]).map(
                      (a) => (
                        <SimpleSelect.Option
                          key={a}
                          id={`${l.id}-${a}`}
                          value={a}
                        >
                          {LINK_ACTION_LABEL[a]}
                        </SimpleSelect.Option>
                      ),
                    )}
                  </SimpleSelect>
                  {links[l.id].action === "fix" && (
                    <TextInput
                      renderLabel={
                        <ScreenReaderContent>
                          New link for {l.label}
                        </ScreenReaderContent>
                      }
                      placeholder="Paste the new link"
                      value={links[l.id].url}
                      onChange={(_e, value) => set(l.id, { url: value })}
                    />
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

// ---- Summary -------------------------------------------------------------------------------------------------
export function SummaryView({ summary }: { summary: CopySummary }) {
  const t = useSurfaceTokens();
  const reasonColor = {
    "left-out": "neutral",
    canvas: "info",
    attention: "warning",
  } as const;
  const reasonLabel = {
    "left-out": "Left out by you",
    canvas: "Not copied",
    attention: "Needs you",
  } as const;
  const total = summary.came.reduce((n, c) => n + c.count, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xl }}>
      <FigmaAlert
        variant={summary.failed.length > 0 ? "warning" : "success"}
        type="inline"
      >
        {total} items came over from {summary.course} on {summary.when}.
        {summary.failed.length > 0 &&
          ` ${summary.failed.length} items failed to copy.`}{" "}
        {summary.notCame.length} things did not come over.
        {summary.datesShifted + summary.datesEdited > 0 &&
          ` ${summary.datesShifted + summary.datesEdited} dates moved to the new term.`}
      </FigmaAlert>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))",
          gap: t.gapCards,
          alignItems: "start",
        }}
      >
        <section
          aria-labelledby="came-over"
          style={{ display: "flex", flexDirection: "column", gap: t.space.sm }}
        >
          <Heading level="h3" variant="titleCardRegular" id="came-over">
            What came over
          </Heading>
          <Table caption={() => "What came over"} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="type">
                  Content
                </Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="count">
                  Items
                </Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="state">
                  Status
                </Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {summary.came.map((c) => (
                <Table.Row themeOverride={noFill} key={c.type}>
                  <Table.Cell themeOverride={noFill}>{c.type}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>{c.count}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>
                    {c.changed ? (
                      <StatusPill color="info">Changed</StatusPill>
                    ) : (
                      <StatusPill color="success">Copied</StatusPill>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </section>
        <section
          aria-labelledby="not-came"
          style={{ display: "flex", flexDirection: "column", gap: t.space.sm }}
        >
          <Heading level="h3" variant="titleCardRegular" id="not-came">
            What didn't come over
          </Heading>
          <Table caption={() => "What didn't come over"} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="item">
                  Item
                </Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="why">
                  Why
                </Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {summary.notCame.map((n) => (
                <Table.Row themeOverride={noFill} key={n.item}>
                  <Table.Cell themeOverride={noFill}>
                    <Text weight="bold">{n.item}</Text>
                    <div>
                      <Text size="small" color="secondary">
                        {n.reason}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>
                    <StatusPill color={reasonColor[n.kind]}>
                      {reasonLabel[n.kind]}
                    </StatusPill>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </section>
      </div>
      {summary.failed.length > 0 && (
        <section
          aria-labelledby="failed"
          style={{ display: "flex", flexDirection: "column", gap: t.space.sm }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: t.space.sm }}
          >
            <Heading level="h3" variant="titleCardRegular" id="failed">
              What failed
            </Heading>
            <StatusPill color="error">
              {summary.failed.length} failed
            </StatusPill>
          </div>
          <Text color="secondary">
            Canvas tried to copy these and could not finish. They are not in the
            counts above.
          </Text>
          <Table caption={() => "What failed"} themeOverride={noFill}>
            <Table.Head themeOverride={noFill}>
              <Table.Row themeOverride={noFill}>
                <Table.ColHeader themeOverride={noFill} id="f-item">
                  Item
                </Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="f-why">
                  What went wrong
                </Table.ColHeader>
                <Table.ColHeader themeOverride={noFill} id="f-fix">
                  What to do
                </Table.ColHeader>
              </Table.Row>
            </Table.Head>
            <Table.Body themeOverride={noFill}>
              {summary.failed.map((f) => (
                <Table.Row themeOverride={noFill} key={f.item}>
                  <Table.Cell themeOverride={noFill}>
                    <Text weight="bold">{f.item}</Text>
                  </Table.Cell>
                  <Table.Cell themeOverride={noFill}>{f.reason}</Table.Cell>
                  <Table.Cell themeOverride={noFill}>{f.fix}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </section>
      )}
      <section
        aria-labelledby="todo"
        style={{ display: "flex", flexDirection: "column", gap: t.space.sm }}
      >
        <Heading level="h3" variant="titleCardRegular" id="todo">
          Still to do after the copy
        </Heading>
        <ul
          style={{
            margin: 0,
            paddingInlineStart: t.space.xl,
            display: "flex",
            flexDirection: "column",
            gap: t.space.xs,
          }}
        >
          {summary.todo.map((item) => (
            <li key={item}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---- The wizard ----------------------------------------------------------------------------------------------
export default function RolloverWizard({
  course,
  comments,
  adjustDates,
  onCancel,
  onDone,
}: {
  course: string;
  comments: EducatorComment[];
  adjustDates: boolean;
  onCancel: () => void;
  onDone: (summary: CopySummary) => void;
}) {
  const t = useSurfaceTokens();
  const steps = useMemo<StepId[]>(
    () =>
      adjustDates
        ? ["comments", "dates", "links", "summary"]
        : ["comments", "links", "summary"],
    [adjustDates],
  );
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [copying, setCopying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [when] = useState(() =>
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(comments.map((c) => [c.id, c.decision])),
  );
  const initialDates = useMemo<DateRow[]>(
    () =>
      DEADLINES.map((dl) => ({
        id: dl.id,
        text: fmtDate(
          addDays(dl.old, daysBetween(OLD_TERM_START, NEW_TERM_START)),
        ),
      })),
    [],
  );
  const [dates, setDates] = useState<DateRow[]>(initialDates);
  const [links, setLinks] = useState<LinkState>(() =>
    Object.fromEntries(
      BROKEN_LINKS.map((l) => [
        l.id,
        l.suggestion
          ? { action: "fix" as LinkAction, url: l.suggestion }
          : { action: "later" as LinkAction, url: "" },
      ]),
    ),
  );

  const summary = useMemo<CopySummary>(() => {
    const left = comments.filter((c) => decisions[c.id] === "leave-out");
    const fixLater = comments.filter((c) => decisions[c.id] === "fix-later");
    const edited = dates.filter(
      (r, i) => r.text !== initialDates[i].text,
    ).length;
    const adjusted = adjustDates ? dates.length : 0;
    const unresolved = BROKEN_LINKS.filter(
      (l) => links[l.id].action === "later",
    );
    const fixedLinks = BROKEN_LINKS.filter(
      (l) => links[l.id].action === "fix" && links[l.id].url.trim() !== "",
    ).length;
    const types = new Set(fixLater.map((c) => AREA_TO_TYPE[c.area]));
    const came = COPIED_COUNTS.map((c) => ({
      type: c.type,
      count:
        c.count -
        left.filter((l) => AREA_TO_TYPE[l.area] === c.type).length -
        FAILED_ITEMS.filter((f) => f.type === c.type).length,
      changed:
        types.has(c.type) ||
        (adjustDates &&
          ["Assignments", "Quizzes", "Discussions", "Calendar events"].includes(
            c.type,
          )) ||
        (fixedLinks > 0 && c.type === "Pages"),
    }));
    return {
      course,
      when,
      came,
      failed: FAILED_ITEMS.map(({ item, reason, fix }) => ({
        item,
        reason,
        fix,
      })),
      notCame: [
        ...left.map((c) => ({
          item: c.item,
          reason: `${c.area}. You chose to leave it out.`,
          kind: "left-out" as const,
        })),
        ...unresolved.map((l) => ({
          item: l.label,
          reason: `${l.problem}. Still broken in ${l.where}.`,
          kind: "attention" as const,
        })),
        {
          item: "Student submissions and grades",
          reason: "Canvas never copies these.",
          kind: "canvas" as const,
        },
        {
          item: "Enrollments and groups",
          reason: "Add people to the new course.",
          kind: "canvas" as const,
        },
        {
          item: "Feature options",
          reason: "Turn them on again in Settings.",
          kind: "canvas" as const,
        },
      ],
      todo: [
        ...FAILED_ITEMS.map((f) => `Copy failed for ${f.item}. ${f.fix}`),
        ...fixLater.map((c) => `${c.item}: ${c.text}`),
        ...unresolved.map((l) => `Fix the link "${l.label}" in ${l.where}.`),
        "Check the quiz settings, the gradebook and the publish state.",
      ],
      datesShifted: adjusted - (adjustDates ? edited : 0),
      datesEdited: adjustDates ? edited : 0,
    };
  }, [
    comments,
    decisions,
    dates,
    initialDates,
    links,
    adjustDates,
    course,
    when,
  ]);

  // The copy takes a moment. The progress bar moves, then the summary shows.
  useEffect(() => {
    if (!copying) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return p;
        return Math.min(100, p + 12);
      });
    }, 180);
    return () => clearInterval(timer);
  }, [copying]);
  useEffect(() => {
    if (!copying || progress < 100) return;
    const done = setTimeout(() => {
      setCopying(false);
      setStep(steps.length - 1);
      setReached(steps.length - 1);
      onDone(summary);
    }, 400);
    return () => clearTimeout(done);
  }, [copying, progress, steps.length, onDone, summary]);

  const id = steps[step];
  const last = steps.length - 1;
  const beforeSummary = step === last - 1;
  const go = (i: number) => {
    setStep(i);
    setReached((r) => Math.max(r, i));
  };
  const startCopy = () => {
    setProgress(0);
    setCopying(true);
  };

  return (
    <Modal
      open
      onDismiss={onCancel}
      size="large"
      label={`Copy content from ${course}`}
      shouldCloseOnDocumentClick={false}
    >
      <Modal.Header>
        <CloseButton
          placement="end"
          offset="small"
          onClick={onCancel}
          screenReaderLabel="Close"
        />
        <Heading level="h2">Copy content from {course}</Heading>
        <div style={{ marginTop: t.space.lg }}>
          <Stepper steps={steps} current={step} reached={reached} onGo={go} />
        </div>
      </Modal.Header>
      <Modal.Body>
        {copying ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.space.lg,
              padding: `${t.space.xxl} 0`,
            }}
          >
            <Heading level="h3" variant="titleCardRegular">
              Copying content
            </Heading>
            <ProgressBar
              screenReaderLabel="Copying content"
              valueNow={progress}
              valueMax={100}
              renderValue={({ valueNow }) => `${valueNow}%`}
            />
            <Text color="secondary">
              Applying your choices from the review.
            </Text>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.space.xl,
            }}
          >
            <div>
              <Heading level="h3" variant="titleSection">
                {id === "summary"
                  ? ""
                  : `Step ${step + 1} of ${steps.length}: `}
                {STEP_INFO[id].name}
              </Heading>
              <Text as="p" color="secondary">
                {STEP_INFO[id].lead}
              </Text>
            </div>
            {id === "comments" && (
              <CommentsStep
                course={course}
                comments={comments}
                decisions={decisions}
                onDecide={(cid, d) => setDecisions({ ...decisions, [cid]: d })}
              />
            )}
            {id === "dates" && <DatesStep rows={dates} setRows={setDates} />}
            {id === "links" && <LinksStep links={links} setLinks={setLinks} />}
            {id === "summary" && <SummaryView summary={summary} />}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {id === "summary" ? (
          <Button color="primary" onClick={onCancel}>
            Done
          </Button>
        ) : (
          <div
            style={{
              display: "flex",
              gap: t.gapButtons,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={onCancel}
              interaction={copying ? "disabled" : "enabled"}
            >
              Cancel
            </Button>
            <div style={{ display: "flex", gap: t.gapButtons }}>
              <Button
                onClick={() => go(step - 1)}
                interaction={step === 0 || copying ? "disabled" : "enabled"}
              >
                Back
              </Button>
              {beforeSummary ? (
                <Button
                  color="primary"
                  onClick={startCopy}
                  interaction={copying ? "disabled" : "enabled"}
                >
                  Copy content
                </Button>
              ) : (
                <Button color="primary" onClick={() => go(step + 1)}>
                  Next: {STEP_INFO[steps[step + 1]].name}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
}
