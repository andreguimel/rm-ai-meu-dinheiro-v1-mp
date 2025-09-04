// Teste da função formatPhoneBrazil corrigida
const cleanPhoneForStorage = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");

  // If it's a mobile number with 11 digits and starts with a valid area code
  // and the 3rd digit is 9, remove the 9
  if (cleaned.length === 11 && cleaned[2] === "9") {
    // Keep area code (first 2 digits) + remove the 9 + keep the rest
    return cleaned.slice(0, 2) + cleaned.slice(3);
  }

  return cleaned;
};

const formatPhone = (phone) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

// Função formatPhoneBrazil corrigida
const formatPhoneBrazil = (phone) => {
  // Use cleanPhoneForStorage to ensure proper mobile number format
  const cleaned = cleanPhoneForStorage(phone);
  if (!cleaned) return "";

  // Add +55 if not present and format
  if (cleaned.length === 10) {
    return `+55 ${formatPhone(cleaned)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith("55")) {
    const localNumber = cleaned.slice(2);
    return `+55 ${formatPhone(localNumber)}`;
  }

  return `+55 ${formatPhone(cleaned)}`;
};

console.log("=== TESTE FORMATPHONEBRAZIL CORRIGIDA ===");

// Teste com número que estava sendo salvo no banco (sem o 9)
console.log("1. Número salvo no banco: 8199999999");
const formattedFromDB = formatPhoneBrazil("8199999999");
console.log("   Formatado para exibição:", formattedFromDB);
console.log("   Esperado: +55 (81) 9999-9999");

// Teste com número que tem o 9 extra (como vinha da UI)
console.log("\n2. Número com 9 extra: 81999999999");
const formattedWith9 = formatPhoneBrazil("81999999999");
console.log("   Formatado para exibição:", formattedWith9);
console.log("   Esperado: +55 (81) 9999-9999");

// Teste com número já formatado
console.log("\n3. Número já formatado: (81) 9 9999-9999");
const formattedAlready = formatPhoneBrazil("(81) 9 9999-9999");
console.log("   Formatado para exibição:", formattedAlready);
console.log("   Esperado: +55 (81) 9999-9999");
