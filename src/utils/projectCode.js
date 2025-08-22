/**
 * Simple project code generation helper:
 * - customerCode: "0001"
 * - serial: integer
 * - letterSuffix: A, B, C...
 *
 * Stores Pro_code as:
 * {
 *   customerCode: "0001",
 *   serial: 1,
 *   suffix: "A",
 *   code: "0001.0001A",
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 *
 * NOTE: For production you should store and increment serials atomically (e.g., a counters collection).
 */

export const makeProjectCode = ({ customerCode, serial = 1, suffix = "A" }) => {
  const left = String(customerCode).padStart(4, "0");
  const right = String(serial).padStart(4, "0") + String(suffix);
  const code = `${left}.${right}`;
  return {
    customerCode: left,
    serial,
    suffix,
    code,
    createdAt: new Date().toISOString()
  };
};
