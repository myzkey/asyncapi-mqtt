export function toPascalCase(input: string): string {
  let out = "";
  let capitalizeNext = true;

  for (const char of input) {
    if (/^[a-zA-Z0-9]$/.test(char)) {
      out += capitalizeNext ? char.toUpperCase() : char;
      capitalizeNext = false;
    } else {
      capitalizeNext = true;
    }
  }

  if (out.length === 0) {
    return "Value";
  }

  return /^[0-9]/.test(out) ? `Value${out}` : out;
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
