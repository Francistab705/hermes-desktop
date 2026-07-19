# Memory

The Memory screen groups persistent agent context, user facts, external recall providers, and persona editing under one profile-scoped surface.

[[src/renderer/src/screens/Memory/Memory.tsx#Memory]] loads the local memory files through `readMemory(profile)`, the active provider through `getConfig("memory.provider")`, and discoverable provider plugins through `discoverMemoryProviders(profile)`. The renderer treats the profile id as the storage key, matching [[agent-sync#Cloud agent sync#Sync engine]] and [[sidebar-navigation#Profile detail modal]].

## Agent Memory

Agent Memory is the built-in long-term fact list stored in `memories/MEMORY.md` for the active profile.

[[src/main/memory.ts#readMemory]] parses `MEMORY.md` into editable entries split by the section delimiter, and [[src/renderer/src/screens/Memory/MemoryEntries.tsx#MemoryEntries]] lets users add, edit, and delete those entries manually. [[src/main/memory.ts#addMemoryEntry]] and [[src/main/memory.ts#updateMemoryEntry]] enforce `memory.memory_char_limit` from `config.yaml`, falling back to [[src/main/memory-limits.ts#DEFAULT_MEMORY_CHAR_LIMIT]]. Cloud agent sync maps this same raw file to the backend `memory` field.

## User Profile

User Profile is a compact freeform description of the human user, stored separately from agent-learned memories.

[[src/main/memory.ts#readMemory]] reads `memories/USER.md` and reports its character usage, while [[src/renderer/src/screens/Memory/MemoryProfile.tsx#MemoryProfile]] saves edits through `writeUserProfile`. The limit comes from `memory.user_char_limit`, falling back to [[src/main/memory-limits.ts#DEFAULT_USER_CHAR_LIMIT]]. The capacity card shows session count beside this section because both describe user context, but chat sessions remain in `state.db`.

## Providers

Providers select an optional external memory backend that runs alongside the built-in `MEMORY.md` file.

[[src/main/installer.ts#discoverMemoryProviders]] scans the Hermes Agent `plugins/memory` directory, labels known providers and required environment variables, and marks the provider configured at `memory.provider`. [[src/renderer/src/screens/Memory/MemoryProviders.tsx#MemoryProviders]] activates providers by writing that config key and stores provider secrets through the environment bridge. Deactivating clears `memory.provider`; it does not delete built-in memories.

## Persona

Persona is the agent instruction prompt (`SOUL.md`), exposed in the Memory screen as the Soul tab.

[[src/renderer/src/screens/Soul/Soul.tsx#Soul]] reads, autosaves, and resets the active profile's `SOUL.md` through the soul IPC handlers. It is grouped with Memory because persona and memory both shape future agent behavior, but cloud sync maps it separately to the backend `systemPrompt` field rather than to `memory`.

## Capacity Cards

The capacity cards summarize only built-in local files and do not include external provider storage.

[[src/renderer/src/screens/Memory/CapacityCards.tsx#CapacityCards]] renders the `MEMORY.md` character count and entry count, plus the `USER.md` character count and total local session count from `state.db`. Provider state and persona size are intentionally not part of those cards.
