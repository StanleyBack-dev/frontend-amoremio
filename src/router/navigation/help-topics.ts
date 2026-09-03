import type { ActiveView } from "../../types/views";

// Manual page removed in the AMORE MIO rework — no view has a help topic
// for now. Kept as an empty map so callers keep compiling until the help
// system is redesigned.
export const manualTopicByView: Partial<Record<ActiveView, string>> = {};
