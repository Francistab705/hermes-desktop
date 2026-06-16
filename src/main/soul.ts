import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { profileHome, safeWriteFile } from "./utils";
import { OPENUI_SYSTEM_INSTRUCTIONS } from "./hermes";

const DEFAULT_SOUL = `You are Hermes, a helpful AI assistant. You are friendly, knowledgeable, and always eager to help.

You communicate clearly and concisely. When asked to perform tasks, you think step-by-step and explain your reasoning. You are honest about your limitations and ask for clarification when needed.

You strive to be helpful while being safe and responsible. You respect the user's privacy and handle sensitive information carefully.
`;

const OPENUI_MARKER = "<!-- openui-generation-guidance -->";

export function readSoul(profile?: string): string {
  const soulFile = join(profileHome(profile), "SOUL.md");
  if (!existsSync(soulFile)) return "";

  try {
    return readFileSync(soulFile, "utf-8");
  } catch {
    return "";
  }
}

export function writeSoul(content: string, profile?: string): boolean {
  const soulFile = join(profileHome(profile), "SOUL.md");

  try {
    safeWriteFile(soulFile, content);
    return true;
  } catch {
    return false;
  }
}

export function resetSoul(profile?: string): string {
  writeSoul(DEFAULT_SOUL, profile);
  return DEFAULT_SOUL;
}

/**
 * Ensures the OpenUI generation guidance is present in SOUL.md.
 * Uses a hidden HTML comment marker to detect presence and allow
 * updates when the guidance content changes. Idempotent — safe to
 * call on every app launch.
 */
export function ensureOpenUIGuidanceInSoul(profile?: string): void {
  let soul = readSoul(profile);

  // SOUL.md doesn't exist yet — create it with defaults + guidance
  if (!soul) {
    soul = DEFAULT_SOUL;
  }

  const guidanceBlock =
    `\n\n${OPENUI_MARKER}\n${OPENUI_SYSTEM_INSTRUCTIONS}\n${OPENUI_MARKER}\n`;

  if (soul.includes(OPENUI_MARKER)) {
    // Replace the existing guidance block with the latest version
    const markerRe = new RegExp(
      `\\n?\\n?${escapeRegExp(OPENUI_MARKER)}[\\s\\S]*?${escapeRegExp(OPENUI_MARKER)}\\n?`,
    );
    const updated = soul.replace(markerRe, guidanceBlock);
    if (updated !== soul) {
      writeSoul(updated, profile);
    }
  } else {
    // Append guidance for the first time
    writeSoul(soul.trimEnd() + guidanceBlock, profile);
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
