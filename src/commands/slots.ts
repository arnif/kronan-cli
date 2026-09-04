/** Read-only delivery-slot commands. */

import { getAddresses, getDeliverySlots, getPickupSlots } from "../api.ts";
import { requireAuth } from "../auth.ts";

export async function deliverySlotsCommand(
  options: { addressId?: number; json?: boolean } = {},
): Promise<void> {
  const token = await requireAuth();
  const addresses = await getAddresses(token);
  const address = options.addressId
    ? addresses.find((candidate) => candidate.id === options.addressId)
    : (addresses.find((candidate) => candidate.isDefaultShipping) ??
      addresses[0]);

  if (!address) {
    throw new Error(
      "No delivery address is configured for this Krónan account.",
    );
  }

  if (options.addressId && !address) {
    throw new Error(
      `Address ${options.addressId} is not available to this account.`,
    );
  }

  const days = await getDeliverySlots(token, address.id);
  const available = days
    .map((day) => ({
      ...day,
      slots: day.slots.filter((slot) => slot.availabilityStatus !== 0),
    }))
    .filter((day) => day.slots.length > 0);

  if (options.json) {
    console.log(
      JSON.stringify({ addressId: address.id, days: available }, null, 2),
    );
    return;
  }

  if (available.length === 0) {
    console.log("No delivery slots are currently available.");
    return;
  }

  const first = available[0]!;
  const firstSlot = first.slots[0]!;
  console.log(
    `Next delivery: ${first.day} ${firstSlot.timeStart.slice(0, 5)}–${firstSlot.timeStop.slice(0, 5)}`,
  );
  console.log("\nAvailable delivery slots:");
  for (const day of available) {
    console.log(`  ${day.day}`);
    for (const slot of day.slots) {
      const capacity =
        slot.availabilityStatus === -1
          ? "available"
          : `${slot.availabilityStatus} left`;
      console.log(
        `    ${slot.timeStart.slice(0, 5)}–${slot.timeStop.slice(0, 5)}  (${capacity})`,
      );
    }
  }
}

export async function pickupSlotsCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const stores = await getPickupSlots(await requireAuth());
  if (options.json) {
    console.log(JSON.stringify(stores, null, 2));
    return;
  }
  for (const store of stores) {
    const next = store.days
      .flatMap((day) => day.slots.map((slot) => ({ day: day.day, ...slot })))
      .find((slot) => slot.availabilityStatus !== 0);
    if (next) {
      console.log(
        `${store.storeName}: ${next.day} ${next.timeStart.slice(0, 5)}–${next.timeStop.slice(0, 5)}`,
      );
    }
  }
}

export async function addressesCommand(
  options: { json?: boolean } = {},
): Promise<void> {
  const addresses = await getAddresses(await requireAuth());
  if (options.json) {
    console.log(JSON.stringify(addresses, null, 2));
    return;
  }
  for (const address of addresses) {
    const marker = address.isDefaultShipping ? " (default)" : "";
    console.log(
      `${address.id}: ${address.streetAddress1}, ${address.postalCode} ${address.city}${marker}`,
    );
  }
}
