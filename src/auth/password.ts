import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Hashes plain passwords before persistence.
export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Compares plaintext passwords against stored hashes.
export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
