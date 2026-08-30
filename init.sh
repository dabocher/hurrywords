#!/usr/bin/env bash
# init.sh — Verificación e inicialización del entorno
#
# Este script lo ejecuta el agente al COMENZAR una sesión y antes de
# declarar cualquier tarea como `done`. Si falla, la sesión no debe avanzar.
#
# IMPORTANTE: este script instala dependencias él mismo (npm install).
# El agente nunca necesita pedir permiso para instalar paquetes ni inventar
# workarounds: si package.json cambió, init.sh lo refleja en node_modules
# antes de correr nada más. Esto existe específicamente para evitar que un
# agente quede atascado en un bucle de "falta una dependencia pero no puedo
# instalarla".
#
# Salida esperada: códigos de salida claros y bloques marcados con [OK]/[FAIL].

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN] ${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0

echo "── 1. Verificando entorno ─────────────────────────────"

if ! command -v node >/dev/null 2>&1; then
  fail "node no está instalado"
  exit 1
fi
ok "node -> $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
  fail "npm no está instalado"
  exit 1
fi
ok "npm -> $(npm --version)"

# Versión mínima de Node (App Router de Next.js requiere Node 18.18+)
NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
NODE_MINOR=$(node -e 'console.log(process.versions.node.split(".")[1])')
if [ "$NODE_MAJOR" -lt 18 ] || { [ "$NODE_MAJOR" -eq 18 ] && [ "$NODE_MINOR" -lt 18 ]; }; then
  fail "Se requiere Node >= 18.18"
  exit 1
fi
ok "Versión de Node compatible"

echo ""
echo "── 2. Verificando archivos base del arnés ──────────────"

for f in AGENTS.md feature_list.json progress/current.md docs/architecture.md docs/conventions.md docs/verification.md CHECKPOINTS.md package.json; do
  if [ ! -f "$f" ]; then
    fail "Falta archivo base: $f"
    EXIT_CODE=1
  else
    ok "Existe $f"
  fi
done

echo ""
echo "── 3. Instalando dependencias ──────────────────────────"
# Esto es lo que evita el bucle infinito: el harness instala, el agente no
# necesita pedir permiso ni rodear esto con un workaround.

if [ -f "package-lock.json" ]; then
  if npm ci --prefer-offline --no-audit --fund=false 2>&1; then
    ok "npm ci completado"
  else
    warn "npm ci falló, probando npm install"
    if npm install --prefer-offline --no-audit --fund=false 2>&1; then
      ok "npm install completado"
    else
      fail "No se pudieron instalar las dependencias"
      EXIT_CODE=1
    fi
  fi
else
  if npm install --prefer-offline --no-audit --fund=false 2>&1; then
    ok "npm install completado (no había package-lock.json)"
  else
    fail "No se pudieron instalar las dependencias"
    EXIT_CODE=1
  fi
fi

echo ""
echo "── 4. Validando feature_list.json ──────────────────────"

node - <<'NODE'
const fs = require("fs");
try {
  const data = JSON.parse(fs.readFileSync("feature_list.json", "utf-8"));
  const valid = new Set(["pending", "in_progress", "done", "blocked"]);
  const inProgress = data.features.filter((f) => f.status === "in_progress");
  if (inProgress.length > 1) {
    console.log(`[FAIL]  Hay ${inProgress.length} features en in_progress (máximo 1)`);
    process.exit(1);
  }
  for (const f of data.features) {
    if (!valid.has(f.status)) {
      console.log(`[FAIL]  Estado inválido en feature ${f.id}: ${f.status}`);
      process.exit(1);
    }
  }
  console.log(`[OK]    feature_list.json válido (${data.features.length} features)`);
} catch (e) {
  console.log(`[FAIL]  feature_list.json inválido: ${e.message}`);
  process.exit(1);
}
NODE

if [ $? -ne 0 ]; then EXIT_CODE=1; fi

echo ""
echo "── 5. Type-checking ─────────────────────────────────────"

if npm run typecheck 2>&1; then
  ok "tsc --noEmit sin errores"
else
  fail "Hay errores de tipos"
  EXIT_CODE=1
fi

echo ""
echo "── 6. Lint ──────────────────────────────────────────────"

if npm run lint 2>&1; then
  ok "ESLint sin errores"
else
  fail "ESLint encontró problemas"
  EXIT_CODE=1
fi

echo ""
echo "── 7. Tests unitarios / componentes (Vitest) ────────────"

if npm test 2>&1; then
  ok "Todos los tests de Vitest pasan"
else
  fail "Hay tests rotos"
  EXIT_CODE=1
fi

echo ""
echo "── 8. Build de producción ───────────────────────────────"

if npm run build 2>&1; then
  ok "next build completado sin errores"
else
  fail "El build de producción falló"
  EXIT_CODE=1
fi

echo ""
echo "── 9. Resumen ──────────────────────────────────────────"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo. Puedes empezar a trabajar."
  echo ""
  echo "Nota: los tests e2e (Playwright) NO corren aquí por defecto."
  echo "Si tu feature tiene requires_e2e=true en feature_list.json, corre"
  echo "  npx playwright install --with-deps chromium  (una vez)"
  echo "  npm run test:e2e"
else
  fail "Entorno NO está listo. Resuelve los errores antes de avanzar."
fi

exit $EXIT_CODE
