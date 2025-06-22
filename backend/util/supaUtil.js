/* ================ [ IMPORTS ] ================ */

import { supabase } from "./clients.js";

/* ================ [ TYPES ] ================ */

const CreatorStatus = Object.freeze({
  CREATOR_APPROVED: "CREATOR_APPROVED",
  CONTRACT_SIGNED: "CONTRACT_SIGNED",
  DRAFT_SUBMITTED: "DRAFT_SUBMITTED",
  DRAFT_APPROVED: "DRAFT_APPROVED",
  VIDEO_LIVE: "VIDEO_LIVE",
  PAYMENT_COMPLETE: "PAYMENT_COMPLETE",
});

const PaymentStatus = Object.freeze({
  WAITING: "WAITING",
  READY: "READY",
  EMAILED: "EMAILED",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
});

/* ================ [ HELPERS ] ================ */

function getValidStates(status = null) {
  const res = Object.values(CreatorStatus);
  if (!status) return res;
  return res.slice(res.indexOf(status));
}

/* ================ [ FUNCTIONS ] ================ */

async function saqTable(table, data = {}, status = null, ...queries) {
  const instances = await searchTable(table, data, status);
  if (!instances) return null;
  return await queryTable(
    table,
    instances.map((i) => i.id),
    ...queries,
  );
}

async function sauTable(table, data = {}, status = null, newData) {
  const instances = await searchTable(table, data, status);
  if (!instances) return null;
  return await updateTable(
    table,
    instances.map((i) => i.id),
    newData,
  );
}

async function searchTable(table, data = {}, status = null) {
  let query = supabase.from(table).select("id");

  // Data filter
  for (const [key, value] of Object.entries(data)) {
    if (value != null) {
      query = query.eq(key, value);
    } else {
      query = query.is(key, null);
    }
  }

  // Status filter
  const validStatuses = getValidStates(status);
  if (status === null) {
    query = query.or(`status.in.(${validStatuses.join(",")}),status.is.null`);
  } else {
    query = query.in("status", validStatuses);
  }

  // Execute query
  const { data: res, error } = await query;
  if (error) throw error;
  return res ?? null;
}

async function queryTable(table, instance, ...queries) {
  let query = supabase.from(table).select(queries.join(", "));

  if (Array.isArray(instance)) {
    query = query.in("id", instance);
  } else {
    query = query.eq("id", instance).single();
  }

  const { data: res, error } = await query;
  if (error) throw error;
  return res ?? null;
}

async function updateTable(table, instance, data) {
  let query = supabase.from(table).update(data);

  if (Array.isArray(instance)) {
    query = query.in("id", instance);
  } else {
    query = query.eq("id", instance).single();
  }

  await query;
}

/* ================ [ EXPORTS ] ================ */

export {
  CreatorStatus,
  PaymentStatus,
  getValidStates,
  saqTable,
  sauTable,
  searchTable,
  queryTable,
  updateTable,
};
