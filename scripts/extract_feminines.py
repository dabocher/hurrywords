#!/usr/bin/env python3
"""
Script para extraer lemas con notación de género desde el PDF del DLE.

Formato en el PDF:
  abandonado, da. (Del part. de abandonar). adj. 1. Descuidado...
  abacalero, ra. adj. 1. Filip. Perteneciente...

La femenina se genera: masculine[:-1] + feminine_suffix[0]
  "abandonado"[:-1] + "a" = "abandonada"
  "abacalero"[:-1] + "a" = "abacalera"
"""

import json
import re
import subprocess
import sys
from pathlib import Path


PDF_PATH = Path(__file__).parent.parent / "data" / "Diccionario de la Lengua Espanola. 1-2-Real Academia Espanola-2014.pdf"
DATA_DIR = Path(__file__).parent.parent / "data"
WORDS_JSONL = DATA_DIR / "words.jsonl"
OUTPUT_FEMININES = DATA_DIR / "feminines.jsonl"
OUTPUT_MERGED = DATA_DIR / "words-merged.jsonl"

# Regex para extraer lemas con notación de género
# Formato: masculino, sufijo. donde sufijo es 1-3 letras
# Filtramos falsos positivos como "S", "U", "P", "etc", "nia" (no son sufijos de género)
LEMMA_PATTERN = re.compile(r'^(\s*)([^\s,]+),\s+([a-záéíóúüñ]{1,3})\.\s+(.*)')

# Sufijos que NO son de género (falsos positivos del PDF)
NON_GENDER_SUFFIXES = {
    "s", "u", "p", "n", "y", "se", "on", "en", "etc", "nia", "mia",
    "var", "tra", "fin", "dia", "fa", "gia", "ba", "cha", "lia", "cia",
}

# Sufijos válidos de género
VALID_GENDER_SUFFIXES = {
    "a", "a.", "da", "ra", "na", "ca", "ta", "va", "sa", "la", "ga",
    "za", "ja", "ña", "ma", "ria",
}


def extract_text_from_pdf(pdf_path: Path, output_path: Path) -> None:
    """Extraer texto del PDF usando pdftotext con layout."""
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), str(output_path)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr}")


def parse_lemmas(text_path: Path) -> list[dict]:
    """Parsear lemas con notación de género desde el texto extraído."""
    lemas = []
    with open(text_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            match = LEMMA_PATTERN.match(line)
            if not match:
                continue

            masculine = match.group(2)
            feminine_suffix = match.group(3)
            rest = match.group(4)

            # Validar que el masculino tenga al menos 3 letras
            if len(masculine) < 3:
                continue

            # Filtrar sufijos no válidos (falsos positivos)
            if feminine_suffix in NON_GENDER_SUFFIXES:
                continue

            # Validar que el sufijo sea de género (termine en 'a')
            if not feminine_suffix.endswith("a") and feminine_suffix not in ("nia", "mia"):
                # Los sufijos de género terminan en 'a' en español
                # Excepción: "nia" y "mia" son válidos para palabras como "abisinio, nia"
                pass

            # Generar la forma femenina según la terminación del masculino.
            # El diccionario RAE usa notación: masculino, sufijo.
            # donde sufijo indica la terminación femenina (1-3 letras + punto).
            # La femenina se construye reemplazando la terminación masculina.
            #
            # Reglas de derivación:
            # - "-o" → "-a" (ej: abandonado,da. → abandonada)
            # - "-ón" → "-ona" (ej: bobalicón,na. → bobalicona)
            # - "-dor/-dor" → "-dora" (ej: abarcador,ra. → abarcadora)
            # - "-tor/-tor" → "-tora" (ej: actor,ra. → actora)
            # - "-or" (sin -dor/-tor) → "-ora" (ej: actor,ra. → actora)

            if masculine.endswith("ón"):
                feminine = masculine[:-2] + "ona"
            elif masculine.endswith("dor"):
                feminine = masculine[:-3] + "dora"
            elif masculine.endswith("tor"):
                feminine = masculine[:-3] + "tora"
            elif masculine.endswith("án"):
                feminine = masculine[:-2] + "ana"
            elif masculine.endswith("or"):
                feminine = masculine[:-2] + "ora"
            elif masculine.endswith("el"):
                feminine = masculine[:-2] + "ela"
            elif masculine.endswith("il"):
                feminine = masculine[:-2] + "ila"
            elif masculine.endswith("és"):
                feminine = masculine[:-2] + "esa"
            else:
                # Regla general: reemplazar última letra ("-o") por "-a"
                # Ej: "abandonado" → "abandonada", "abacalero" → "abacalera"
                feminine = masculine[:-1] + "a"

            # Normalizar a minúsculas
            masculine_norm = masculine.lower().strip()
            feminine_norm = feminine.lower().strip()

            lemas.append({
                "masculine": masculine_norm,
                "feminine": feminine_norm,
                "masculine_raw": masculine,
                "feminine_raw": feminine,
                "suffix": feminine_suffix,
                "rest_of_line": rest[:200],
            })

    return lemas


def load_existing_words(words_path: Path) -> dict[str, dict]:
    """Cargar el words.jsonl existente en un dict para merge."""
    words = {}
    with open(words_path, "r", encoding="utf-8") as f:
        for line in f:
            word = json.loads(line.strip())
            lemma = word["lemma"].lower()
            if lemma not in words:
                words[lemma] = word
    return words


def generate_feminine_entries(lemas: list[dict], existing_words: dict[str, dict]) -> list[dict]:
    """Generar entradas para las formas femeninas."""
    entries = []
    for lema in lemas:
        masculine = lema["masculine"]
        feminine = lema["feminine"]

        # Buscar la entrada masculina en el diccionario existente
        if masculine not in existing_words:
            continue

        existing = existing_words[masculine]

        # Crear una nueva entrada con el lema femenino
        feminine_entry = dict(existing)
        feminine_entry["lemma"] = feminine

        entries.append(feminine_entry)

    return entries


def main() -> int:
    """Ejecutar la extracción y merge."""
    print("=" * 60)
    print("Extracción de lemas con notación de género del DLE")
    print("=" * 60)

    # Paso 1: Verificar archivos
    if not PDF_PATH.exists():
        print(f"❌ PDF no encontrado: {PDF_PATH}")
        return 1

    if not WORDS_JSONL.exists():
        print(f"❌ words.jsonl no encontrado: {WORDS_JSONL}")
        return 1

    # Paso 2: Extraer texto del PDF
    print("\n📄 Extrayendo texto del PDF...")
    temp_text = Path("/tmp/rae_extracted.txt")
    extract_text_from_pdf(PDF_PATH, temp_text)
    print(f"   Texto extraído: {temp_text.stat().st_size:,} bytes")

    # Paso 3: Parsear lemas
    print("\n🔍 Buscando lemas con notación de género...")
    lemas = parse_lemmas(temp_text)
    print(f"   Leimas encontrados: {len(lemas)}")

    if not lemas:
        print("❌ No se encontraron lemas con notación de género.")
        return 1

    # Mostrar distribución de sufijos
    suffix_counts: dict[str, int] = {}
    for lema in lemas:
        suffix = lema["suffix"]
        suffix_counts[suffix] = suffix_counts.get(suffix, 0) + 1

    print("\n   Distribución de sufijos femeninos:")
    for suffix, count in sorted(suffix_counts.items(), key=lambda x: -x[1]):
        print(f"      {suffix:4s}: {count:4d}")

    # Mostrar ejemplos
    print("\n   Ejemplos:")
    for lema in lemas[:15]:
        print(f"      {lema['masculine']:20s} → {lema['feminine']:20s} (sufijo: {lema['suffix']})")
    if len(lemas) > 15:
        print(f"      ... y {len(lemas) - 15} más")

    # Paso 4: Cargar palabras existentes
    print("\n📚 Cargando palabras existentes...")
    existing_words = load_existing_words(WORDS_JSONL)
    print(f"   Palabras cargadas: {len(existing_words):,}")

    # Paso 5: Generar entradas femeninas
    print("\n✍️  Generando entradas femeninas...")
    feminine_entries = generate_feminine_entries(lemas, existing_words)
    print(f"   Entradas generadas: {len(feminine_entries)}")

    # Paso 6: Guardar feminines.jsonl
    print(f"\n💾 Guardando {OUTPUT_FEMININES.name}...")
    with open(OUTPUT_FEMININES, "w", encoding="utf-8") as f:
        for entry in feminine_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"   Guardadas {len(feminine_entries)} entradas femeninas.")

    # Paso 7: Merge con words.jsonl existente
    print("\n🔄 Mergeando con words.jsonl existente...")
    merged_words = dict(existing_words)
    new_count = 0
    for entry in feminine_entries:
        lemma = entry["lemma"].lower()
        if lemma not in merged_words:
            merged_words[lemma] = entry
            new_count += 1
        else:
            print(f"   ⚠️  Duplicado: {lemma} (ya existe en words.jsonl)")

    print(f"   Nuevas palabras añadidas: {new_count}")
    print(f"   Total palabras en merge: {len(merged_words):,}")

    # Paso 8: Guardar words-merged.jsonl
    print(f"\n💾 Guardando {OUTPUT_MERGED.name}...")
    with open(OUTPUT_MERGED, "w", encoding="utf-8") as f:
        for word in merged_words.values():
            f.write(json.dumps(word, ensure_ascii=False) + "\n")
    print(f"   {len(merged_words):,} palabras escritas.")

    # Limpiar temp
    temp_text.unlink(missing_ok=True)

    print("\n✅ Extracción completada exitosamente.")
    print(f"\n   Leimas con notación de género: {len(lemas)}")
    print(f"   Formas femeninas generadas: {len(feminine_entries)}")
    print(f"   Nuevas palabras únicas: {new_count}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
