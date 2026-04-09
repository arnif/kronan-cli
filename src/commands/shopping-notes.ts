/**
 * Shopping notes commands (Skundalisti / Scan and Go)
 */

import {
  addShoppingNoteLine,
  clearShoppingNote,
  deleteShoppingNoteLine,
  getArchivedShoppingNoteLines,
  getShoppingNote,
  type PublicShoppingNote,
  toggleShoppingNoteLineComplete,
  updateShoppingNoteLine,
} from "../api.ts";
import { requireAuth } from "../auth.ts";

function formatShoppingNote(note: PublicShoppingNote): void {
  console.log(`${note.name || "Shopping Note"}`);
  console.log(`Token: ${note.token}`);
  console.log(`\nItems:`);

  if (note.lines.length === 0) {
    console.log("  (empty)");
  } else {
    for (const line of note.lines) {
      const status = line.completed ? "[✓]" : "[ ]";
      const text = line.text || line.sku || "Unknown item";
      console.log(`  ${status} ${text}  x${line.quantity}`);
    }
  }
}

export async function notesCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const note = await getShoppingNote(token);

  if (options.json) {
    console.log(JSON.stringify(note, null, 2));
    return;
  }

  formatShoppingNote(note);
}

export async function notesAddCommand(
  options: {
    text?: string;
    sku?: string;
    quantity?: number;
    json?: boolean;
  } = {},
): Promise<void> {
  const { text, sku, quantity = 1, json = false } = options;

  if (!text && !sku) {
    throw new Error("Either --text or --sku must be provided");
  }

  const token = await requireAuth();
  const note = await addShoppingNoteLine(token, { text, sku, quantity });

  if (json) {
    console.log(JSON.stringify(note, null, 2));
    return;
  }

  console.log("Added item to shopping note.");
  console.log("");
  formatShoppingNote(note);
}

export async function notesUpdateCommand(
  lineToken: string,
  updates: { text?: string; quantity?: number },
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const note = await updateShoppingNoteLine(token, lineToken, updates);

  if (options.json) {
    console.log(JSON.stringify(note, null, 2));
    return;
  }

  console.log("Updated shopping note item.");
  console.log("");
  formatShoppingNote(note);
}

export async function notesRemoveCommand(
  lineToken: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  await deleteShoppingNoteLine(token, lineToken);

  if (options.json) {
    console.log(JSON.stringify({ deleted: lineToken }, null, 2));
    return;
  }

  console.log(`Removed item: ${lineToken}`);
}

export async function notesToggleCommand(
  lineToken: string,
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const note = await toggleShoppingNoteLineComplete(token, lineToken);

  if (options.json) {
    console.log(JSON.stringify(note, null, 2));
    return;
  }

  console.log("Toggled item completion.");
  console.log("");
  formatShoppingNote(note);
}

export async function notesClearCommand(
  _options: { force?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  await clearShoppingNote(token);

  console.log("Cleared all items from shopping note.");
}

export async function notesArchivedCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const lines = await getArchivedShoppingNoteLines(token);

  if (options.json) {
    console.log(JSON.stringify(lines, null, 2));
    return;
  }

  console.log("Archived (completed) items:\n");
  if (lines.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of lines) {
      const text = line.text || line.sku || "Unknown item";
      const date = new Date(line.completedAt).toLocaleDateString("is-IS");
      console.log(`  [✓] ${text}  x${line.quantity} (completed ${date})`);
    }
  }
}
