import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

export const verifyPassword = (password: string, encodedHash: string) => {
  const [algorithm, salt, hash] = encodedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const computed = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");

  if (computed.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(computed, stored);
};
