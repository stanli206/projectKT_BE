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
