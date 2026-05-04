
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function calculateEntropy(password) {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    charsetSize += 32;

  const entropy = password.length * Math.log2(charsetSize);
  return entropy;
}

function calculateEntropyStrength(entropy) {
  if (entropy < 30) return "Muy débil";
  if (entropy < 50) return "Débil";
  if (entropy < 60) return "Medio";
  if (entropy < 90) return "Fuerte";
  if (entropy < 120) return "Muy fuerte";
  return "Extremadamente fuerte";
}

function generateRandomPassword(length, options) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?";

  let chars = "";
  if (options.lowercase) chars += lowercase;
  if (options.uppercase) chars += uppercase;
  if (options.numbers) chars += numbers;
  if (options.symbols) chars += symbols;

  if (chars === "") {
    chars = lowercase + uppercase + numbers;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

async function generatePasswordWithAI(
  requirements,
  conversationHistory
) {
  conversationHistory.push({
    role: "user",
    content: `Genera una contraseña segura con los siguientes requisitos: ${requirements}. 
    Proporciona solo la contraseña generada, sin explicaciones adicionales.
    La contraseña debe ser alfanumérica y puede incluir símbolos especiales.`,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `Eres un experto en seguridad informática especializado en generar contraseñas seguras.
    Cuando se te pida generar una contraseña, proporciona una contraseña aleatoria y segura que cumpla con los requisitos especificados.
    Las contraseñas deben ser complejas, aleatorias y difíciles de adivinar.`,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage.trim();
}

async function analyzePasswordStrength(
  password,
  conversationHistory
) {
  conversationHistory.push({
    role: "user",
    content: `Analiza la fortaleza de esta contraseña y proporciona recomendaciones de mejora: "${password}"`,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `Eres un experto en seguridad informática.
    Cuando se te proporcione una contraseña, analiza su fortaleza considerando:
    - Longitud
    - Variedad de caracteres (mayúsculas, minúsculas, números, símbolos)
    - Patrones predecibles
    - Susceptibilidad a ataques comunes
    Proporciona un análisis detallado y recomendaciones específicas.`,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

async function main() {
  console.log("\n🔐 GENERADOR DE CONTRASEÑAS SEGURAS CON MEDIDOR DE ENTROPÍA");
  console.log("=".repeat(60));
  console.log(
    "Sistema avanzado de generación y análisis de contraseñas seguras"
  );
  console.log("=".repeat(60));

  let conversationHistory = [];
  let continueSession = true;

  while (continueSession) {
    console.log("\n¿Qué deseas hacer?");
    console.log("1. Generar contraseña aleatoria");
    console.log("2. Generar contraseña con AI");
    console.log("3. Analizar fortaleza de contraseña");
    console.log("4. Calcular entropía");
    console.log("5. Salir");

    const choice = await question("\nSelecciona una opción (1-5): ");

    switch (choice) {
      case "1": {
        console.log("\n📝 GENERADOR ALEATORIO");
        const lengthStr = await question("Longitud de la contraseña (8-32): ");
        