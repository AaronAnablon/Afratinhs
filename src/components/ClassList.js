import { HiOutlineClock } from "react-icons/hi2";
import { displayTime, groupByDay, shortDate } from "@/utils/schedule";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

// Classes grouped by day ("Today", "Tomorrow", ...), each row with optional actions.
// `dayHeadings={false}` hides the day titles, e.g. for a list that only shows today.
export const ClassList = ({ records, order = "asc", renderActions, renderMeta, showCode = false, dayHeadings = true, emptyState = null }) => {
    const groups = groupByDay(records, order);
    if (groups.length === 0) return emptyState;

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                    {dayHeadings && <h3 className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-slate-900">
                        {group.label}
                        {["Today", "Tomorrow", "Yesterday"].includes(group.label) && (
                            <span className="font-normal text-slate-500">{shortDate(group.date)}</span>
                        )}
                    </h3>}
                    <Card className="divide-y divide-slate-100">
                        {group.items.map((record) => (
                            <div key={record.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
                                    <p className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-slate-500 sm:w-44">
                                        <HiOutlineClock className="h-4 w-4" aria-hidden="true" />
                                        {displayTime(record.time)}
                                    </p>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{record.event}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <Badge tone="brand">{record.section}</Badge>
                                            {showCode && <Badge>Code {record.code}</Badge>}
                                            {renderMeta?.(record)}
                                        </div>
                                    </div>
                                </div>
                                {renderActions && <div className="flex shrink-0 flex-wrap items-center gap-2">{renderActions(record)}</div>}
                            </div>
                        ))}
                    </Card>
                </section>
            ))}
        </div>
    );
};
