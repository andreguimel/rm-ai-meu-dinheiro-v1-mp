// Teste da função applyPhoneMask corrigida
const applyPhoneMask = (value) => {
  if (!value) return "";

  // Remove all non-numeric characters
  const cleanValue = value.replace(/\D/g, "");

  // Limit to maximum 11 digits
  const limitedValue = cleanValue.slice(0, 11);

  // Apply mask based on length
  if (limitedValue.length <= 2) {
    return `(${limitedValue}`;
  } else if (limitedValue.length <= 7) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  } else if (limitedValue.length <= 11) {
    const hasNinthDigit = limitedValue.length === 11;
    if (hasNinthDigit) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(
        2,
        7
      )}-${limitedValue.slice(7, 11)}`;
    } else {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(
        2,
        6
      )}-${limitedValue.slice(6, 10)}`;
    }
  }

  return limitedValue;
};

console.log("=== TESTE APPLYPHONEMASK CORRIGIDA ===");

// Teste progressivo como usuário digitaria
console.log("Simulando digitação progressiva:");
console.log("8 →", applyPhoneMask("8"));
console.log("81 →", applyPhoneMask("81"));
console.log("819 →", applyPhoneMask("819"));
console.log("8199 →", applyPhoneMask("8199"));
console.log("81999 →", applyPhoneMask("81999"));
console.log("819999 →", applyPhoneMask("819999"));
console.log("8199999 →", applyPhoneMask("8199999"));
console.log("81999999 →", applyPhoneMask("81999999"));
console.log("819999999 →", applyPhoneMask("819999999"));
console.log("8199999999 →", applyPhoneMask("8199999999"));
console.log("81999999999 →", applyPhoneMask("81999999999"));

console.log("\n=== TESTE COM MAIS DÍGITOS (DEVE PARAR EM 11) ===");
console.log("819999999999 (12 dígitos) →", applyPhoneMask("819999999999"));
console.log("8199999999999 (13 dígitos) →", applyPhoneMask("8199999999999"));
console.log("81999999999999 (14 dígitos) →", applyPhoneMask("81999999999999"));

console.log("\n=== TESTE COM ENTRADA JÁ FORMATADA ===");
console.log("(81) 99999-99999 →", applyPhoneMask("(81) 99999-99999"));

console.log("\n=== TESTE TELEFONE FIXO ===");
console.log("8133334444 (10 dígitos) →", applyPhoneMask("8133334444"));
