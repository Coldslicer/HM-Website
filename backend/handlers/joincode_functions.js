import { SUPABASE_CLIENT } from '../util/clients.js';

const ALPHABET = 'QWERTYUIOPASDFGHJKLZXCVBNM';
const BASE = ALPHABET.length;
const FIXED_LENGTH = 6; // total length, includes prefix + padding + encoded

const DECODE_MAP = {};
for (let i = 0; i < ALPHABET.length; i++) {
  DECODE_MAP[ALPHABET[i]] = i;
}

function encodeBase(num) {
  let encoded = '';
  while (num > 0) {
    const remainder = num % BASE;
    encoded = ALPHABET[remainder] + encoded;
    num = Math.floor(num / BASE);
  }
  if (encoded === '') encoded = ALPHABET[0]; // encode 0 as first char
  console.log(`[encodeBase] Encoded number to base${BASE}:`, encoded);
  return encoded;
}

function decodeBase(str) {
  let num = 0;
  for (const char of str.toUpperCase()) {
    const val = DECODE_MAP[char];
    if (val === undefined) {
      console.error(`[decodeBase] Invalid character in code: '${char}'`);
      throw new Error('Invalid character in code');
    }
    num = num * BASE + val;
  }
  console.log(`[decodeBase] Decoded string '${str}' to number:`, num);
  return num;
}

// Seeded PRNG for deterministic pseudo-random padding
function seededRandom(seed) {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

function getPseudoRandomPadding(id, length) {
  const rand = seededRandom(id);
  let padding = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(rand() * BASE);
    padding += ALPHABET[index];
  }
  console.log(`[getPseudoRandomPadding] Generated padding for id ${id}:`, padding);
  return padding;
}

// First char encodes the length of significant code (1 to FIXED_LENGTH - 1)
// Because FIXED_LENGTH=6, prefix char encodes values 1..5 (significant length)
// So prefix index is significantLength - 1
// That is, prefix char 'Q' means 1 significant char, 'W' means 2, etc.

function encodePrefix(significantLength) {
  if (significantLength < 1 || significantLength > FIXED_LENGTH - 1) {
    throw new Error('Invalid significant length for prefix encoding');
  }
  const index = significantLength - 1;
  const prefixChar = ALPHABET[index];
  console.log(`[encodePrefix] Encoding significant length ${significantLength} to prefix '${prefixChar}'`);
  return prefixChar;
}

function decodePrefix(char) {
  const index = DECODE_MAP[char];
  if (index === undefined || index < 0 || index >= FIXED_LENGTH - 1) {
    throw new Error('Invalid prefix character in code');
  }
  const significantLength = index + 1;
  console.log(`[decodePrefix] Decoded prefix '${char}' to significant length ${significantLength}`);
  return significantLength;
}

export async function encodeCampaignId(id) {
  console.log(`[encodeCampaignId] Encoding campaign id:`, id);
  const { data: campaign, error } = await SUPABASE_CLIENT
    .from('campaigns')
    .select('identity')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`[encodeCampaignId] Supabase error fetching campaign:`, error);
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }
  if (!campaign || !campaign.identity) {
    console.error(`[encodeCampaignId] Campaign or identity not found for id:`, id);
    throw new Error('Campaign identity not found');
  }

  const encoded = encodeBase(campaign.identity);
  const significantLength = encoded.length;
  if (significantLength > FIXED_LENGTH - 1) {
    console.error(`[encodeCampaignId] Encoded identity length ${significantLength} too large for fixed length`);
    throw new Error('ID too large for fixed length');
  }

  // prefix char encodes length of significant portion
  const prefix = encodePrefix(significantLength);

  // padding fills remaining chars (FIXED_LENGTH - 1 - significantLength)
  const paddingLength = FIXED_LENGTH - 1 - significantLength;
  const padding = getPseudoRandomPadding(campaign.identity, paddingLength);

  const finalCode = prefix + padding + encoded;
  console.log(`[encodeCampaignId] Final encoded & padded code:`, finalCode);
  return finalCode;
}

export async function decodeJoinCode(code) {
  console.log(`[decodeJoinCode] Start decoding for code:`, code);

  if (code.length !== FIXED_LENGTH) {
    console.error(`[decodeJoinCode] Invalid code length: expected ${FIXED_LENGTH}, got ${code.length}`);
    throw new Error('Invalid code length');
  }

  const prefixChar = code[0];
  let significantLength;
  try {
    significantLength = decodePrefix(prefixChar);
  } catch (e) {
    console.error(`[decodeJoinCode] Failed to decode prefix:`, e);
    throw e;
  }

  // Extract significant part from the end
  const significant = code.slice(FIXED_LENGTH - significantLength);
  console.log(`[decodeJoinCode] Extracted significant portion:`, significant);

  let identity;
  try {
    identity = decodeBase(significant);
    console.log(`[decodeJoinCode] Decoded identity:`, identity);
  } catch (e) {
    console.error(`[decodeJoinCode] decodeBase threw error:`, e);
    throw e;
  }

  const { data: campaign, error } = await SUPABASE_CLIENT
    .from('campaigns')
    .select('*')
    .eq('identity', identity)
    .single();

  if (error) {
    console.error(`[decodeJoinCode] Supabase error fetching campaign by identity:`, error);
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }
  if (!campaign) {
    console.error(`[decodeJoinCode] No campaign found for identity:`, identity);
    throw new Error('No campaign found for identity');
  }

  console.log(`[decodeJoinCode] Found campaign for identity:`, campaign);
  return campaign;
}
