#!/usr/bin/env python3
"""
parse-rae-pdf-format.py

Parsea los archivos .txt obtenidos por conversión de los PDF del diccionario RAE
(un archivo por letra, formato B-Diccionario.txt) y genera words.jsonl compatible
con el schema de Convex.

Características:
  - Detecta y genera entradas femeninas a partir de la notación ", XX" del headword
  - Soporta acepciones numeradas separadas por ǁ
  - Extrae etimología, categoría gramatical y registro de uso
  - Elimina superíndices pegados a palabras (baba1 → baba)
  - Deduplicación robusta entre ejecuciones

USO:
    python3 scripts/parse-rae-pdf-format.py B-Diccionario.txt --fresh
    python3 scripts/parse-rae-pdf-format.py C-Diccionario.txt
    python3 scripts/parse-rae-pdf-format.py *.txt --fresh
"""

import re
import json
import sys
import hashlib
from pathlib import Path
from collections import defaultdict

OUT_PATH     = Path("words_pdf.jsonl")   # archivo separado — nunca toca words.jsonl
SKIPPED_PATH = Path("words_pdf_skipped.txt")  # entradas sin acepción para revisión
INPUT_FILES = [f for f in sys.argv[1:] if not f.startswith("--")]

# Carga lemas ya existentes en words_pdf.jsonl para no duplicar
_existing_lemmas: set[str] = set()
if OUT_PATH.exists():
    with open(OUT_PATH, encoding="utf-8") as _ef:
        for _line in _ef:
            try: _existing_lemmas.add(json.loads(_line)["lemma"])
            except: pass
    print(f"  (ya en {OUT_PATH}: {len(_existing_lemmas)} lemas existentes, se omitirán duplicados)")

# ── Helpers de texto ───────────────────────────────────────────────────────

def strip_superindex(text: str) -> str:
    """baba1 → baba, coral2 → coral"""
    return re.sub(r'(?<=[a-záéíóúüñA-ZÁÉÍÓÚÜÑ])\d+', '', text)

def normalize_str(s: str) -> str:
    return (s.lower()
        .replace('á','a').replace('é','e').replace('í','i')
        .replace('ó','o').replace('ú','u').replace('ü','u'))

def strip_final_accent(s: str) -> str:
    for acc, plain in {'á':'a','é':'e','í':'i','ó':'o','ú':'u'}.items():
        if s.endswith(acc):
            return s[:-1] + plain
    return s

def clean_definition(text: str) -> str:
    """Limpia el texto de una definición."""
    # Reemplaza ǁ de aclaraciones en paréntesis: (ǁ algo) → (algo)
    text = re.sub(r'\(ǁ\s*', '(', text)
    # Corta en ■ ☐ ➤ (locuciones, frases hechas — no son definiciones)
    text = re.split(r'[■☐]|➤', text)[0]
    # Elimina superíndices
    text = strip_superindex(text)
    # Normaliza espacios
    text = re.sub(r'\s+', ' ', text).strip().rstrip('.')
    return text

# ── Género ─────────────────────────────────────────────────────────────────

def build_feminine(masculine: str, fem_code: str) -> str | None:
    """
    Calcula la forma femenina a partir del masculino y el código de género RAE.
    Ejemplos:
        babazorro, rra  → babazorra
        babélico, ca    → babélica
        trabajador, ra  → trabajadora
        catalán, na     → catalana
        inglés, sa      → inglesa
    """
    fem  = fem_code.strip().lower()
    masc = masculine.strip().lower()
    if not fem:
        return None

    # Caso 1: termina en 'o', femenino termina en 'a' → reemplaza 'o' por 'a'
    if masc.endswith('o') and fem.endswith('a'):
        return masc[:-1] + 'a'

    # Caso 2: busca solapamiento consonántico entre final del masc. e inicio del sufijo
    best_overlap = 0
    for i in range(1, min(len(masc), len(fem)) + 1):
        if normalize_str(masc[-i:]) == normalize_str(fem[:i]):
            best_overlap = i
        else:
            break

    if best_overlap > 0:
        stem = strip_final_accent(masc[:-best_overlap])
        return stem + fem

    # Caso 3: masculino acaba en consonante → añadir sufijo directamente
    if masc and masc[-1] not in 'aeiouáéíóúü':
        return masc + fem

    # Fallback
    return masc[:-1] + fem

# ── División en entradas ───────────────────────────────────────────────────
# El formato PDF concatena entradas sin separador claro. Localizamos el
# inicio de cada una buscando: [palabra][. opcional género][.][gramática o etim]

_GRAM_LOOKAHEAD = (
    r'\((?:De |Del |Cf\.|Etim\.|Quizá |Der\.)'  # inicio de etimología
    r'|adj\b|adv\b'
    r'|m\b|f\b|com\b|amb\b'
    r'|intr\b|tr\b|prnl\b|defect\b'
    r'|interj\b|prep\b|conj\b'
    r'|suf\b|pref\b|expr\b'
    r'|loc\b'
)

_ENTRY_SPLIT_RE = re.compile(
    r'(?:(?<=\.)|(?<=\?)|(?<=\!)|^)'
    r'\s*'
    r'(?='
        r'[a-záéíóúüñ]'                   # empieza en minúscula
        r'[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\-]{2,}'  # mínimo 3 letras en total
        r'(?:\s*\(\d+\))?'                 # superíndice opcional (1)(2)
        r'(?:,\s*[a-záéíóúüñ]+)?'          # género opcional ", XX"
        r'\.\s*'
        r'(?:' + _GRAM_LOOKAHEAD + r')'
    r')',
    re.IGNORECASE,
)

def split_entries(text: str) -> list[str]:
    """Divide el bloque de texto en entradas individuales."""
    text = re.sub(r'\r\n?', '\n', text)
    positions = [m.start() for m in _ENTRY_SPLIT_RE.finditer(text)]
    if not positions:
        return [text.strip()] if text.strip() else []
    entries = []
    for i, start in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        chunk = text[start:end].strip()
        if chunk:
            entries.append(chunk)
    return entries

# ── Parsing de gramática, registro y acepciones ────────────────────────────

_GRAMMAR_RE = re.compile(
    r'^('
    r'm\.\s+y\s+f\.|m\.\s+o\s+f\.|f\.\s+o\s+m\.|'
    r'm\.|f\.|com\.|adj\.|adv\.|amb\.|'
    r'intr\.|tr\.|prnl\.|defect\.|'
    r'interj\.|prep\.|conj\.|suf\.|pref\.|expr\.|'
    r'loc\.\s+(?:adj|adv|verb|sust|conj|interj|prep)\.'
    r')\s*',
    re.IGNORECASE,
)

_REGISTER_RE = re.compile(
    r'^('
    r'coloq\.|vulg\.|desus\.|ant\.|eufem\.|irón\.|despect\.|'
    r'fest\.|fig\.|joc\.|jerg\.|p\.\s*us\.|poét\.|rur\.|'
    r'malson\.|coloquial[.,]|humoríst\.'
    r')\s*',
    re.IGNORECASE,
)

_ETYM_RE = re.compile(
    r'^\s*\(('
    r'(?:Del?|Cf\.|Etim\.|De\s|Quizá\s|Der\.)[^)]{3,}'
    r')\)\s*\.?\s*',
    re.IGNORECASE,
)

# Abreviaturas que nunca son headwords reales
_FORBIDDEN_HEADWORDS = {
    'loc', 'adj', 'adv', 'intr', 'prnl', 'defect', 'interj',
    'prep', 'conj', 'suf', 'pref', 'expr', 'com', 'amb', 'tr',
    'vulg', 'coloq', 'ant', 'desus', 'fig', 'poét', 'rur',
}

_HEADWORD_RE = re.compile(
    r'^([a-záéíóúüñA-ZÁÉÍÓÚÜÑ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ\-]*(?:\s*\(\d+\))?)'
    r'(?:,\s*([a-záéíóúüñ]+))?'  # género opcional
    r'\.\s*',
    re.IGNORECASE,
)

def parse_senses(body: str, default_grammar: str | None) -> list[dict]:
    """Extrae las acepciones del cuerpo de una entrada."""
    body = body.strip()
    senses = []

    # Gramática de nivel de entrada (puede ser sobreescrita por cada acepción)
    entry_grammar = default_grammar
    gm = _GRAMMAR_RE.match(body)
    if gm:
        entry_grammar = gm.group(1).strip()
        body = body[gm.end():]

    # Divide en bloques de acepción: "ǁ N." o "N." al principio
    # ǁ = separador normal de acepciones
    # ⚪ = separador cuando cambia la gramática (f. → m. → m. y f.)
    sense_blocks = re.split(
        r'(?:ǁ|⚪)\s*'
        r'(?=(?:m\.\s+y\s+f\.|m\.\s+o\s+f\.|f\.\s+o\s+m\.|'
        r'm\.|f\.|com\.|adj\.|adv\.|intr\.|tr\.|prnl\.|defect\.)?\s*\d+\.)',
        body
    )

    if len(sense_blocks) == 1 and not re.match(r'^\d+\.', body.strip()):
        # Acepción única sin numerar
        definition = clean_definition(body)
        if definition and len(definition) > 2:
            sense: dict = {'number': 1}
            if entry_grammar:
                sense['grammar'] = entry_grammar
            rm = _REGISTER_RE.match(definition)
            if rm:
                sense['register'] = rm.group(1).strip().rstrip('.')
                definition = definition[rm.end():].strip()
            sense['definition'] = clean_definition(definition)
            if sense['definition']:
                senses.append(sense)
    else:
        for i, block in enumerate(sense_blocks):
            block = block.strip()
            if not block:
                continue

            sense: dict = {}

            # 1. Gramática primero — cubre el caso '⚪ m. 5. definición'
            gm2 = _GRAMMAR_RE.match(block)
            if gm2:
                sense['grammar'] = gm2.group(1).strip()
                block = block[gm2.end():]

            # 2. Número de acepción
            nm = re.match(r'^(\d+)\.\s*', block)
            num = int(nm.group(1)) if nm else (i + 1)
            if nm:
                block = block[nm.end():]
            sense['number'] = num

            # 3. Gramática de nuevo si no se encontró antes del número
            if 'grammar' not in sense:
                gm2 = _GRAMMAR_RE.match(block)
                if gm2:
                    sense['grammar'] = gm2.group(1).strip()
                    block = block[gm2.end():]
                elif entry_grammar:
                    sense['grammar'] = entry_grammar

            # Registro / marca de uso
            rm = _REGISTER_RE.match(block)
            if rm:
                sense['register'] = rm.group(1).strip().rstrip('.')
                block = block[rm.end():]

            definition = clean_definition(block)
            if definition and len(definition) > 2:
                sense['definition'] = definition
                senses.append(sense)

    return senses

# ── Parser principal ───────────────────────────────────────────────────────

def parse_entry(raw: str) -> tuple[dict | None, dict | None]:
    """
    Parsea una entrada del diccionario.
    Devuelve (entrada_principal, entrada_femenina | None).
    """
    raw = raw.strip()

    # Headword y género opcional
    hm = _HEADWORD_RE.match(raw)
    if not hm:
        return None, None

    headword_raw  = hm.group(1).strip()
    gender_suffix = hm.group(2)   # p.ej. 'rra' de 'babazorro, rra'
    body          = raw[hm.end():]

    # Limpiar headword
    headword = strip_superindex(headword_raw).lower()
    headword = re.sub(r'\s*\(\d+\)', '', headword).strip()

    if not headword or len(headword) < 2:
        return None, None
    if headword in _FORBIDDEN_HEADWORDS:
        return None, None

    # Etimología
    etymology = None
    em = _ETYM_RE.match(body)
    if em:
        etymology = strip_superindex(em.group(1).strip()).rstrip('.')
        body = body[em.end():]

    # Acepciones
    senses = parse_senses(body, None)
    if not senses:
        return None, None

    # Entrada principal
    main_doc: dict = {'lemma': headword}
    if etymology:
        main_doc['etymology'] = etymology
    main_doc['senses'] = senses

    # Entrada femenina (referencia cruzada)
    fem_doc = None
    if gender_suffix:
        feminine = build_feminine(headword, gender_suffix)
        if feminine and feminine != headword and re.match(r'^[a-záéíóúüñ]+$', feminine):
            # Determinar la gramática del femenino
            main_gram = senses[0].get('grammar', '')
            fem_gram  = 'adj.' if 'adj' in main_gram else 'f.'
            fem_doc   = {
                'lemma': feminine,
                'senses': [{
                    'number':     1,
                    'grammar':    fem_gram,
                    'definition': f'V. {headword}',
                }],
            }

    return main_doc, fem_doc

# ── Main ───────────────────────────────────────────────────────────────────

def block_hash(text: str) -> str:
    return hashlib.md5(re.sub(r'\s+', ' ', text).encode()).hexdigest()

grouped: dict[str, dict] = {}
_seen: set[str] = set()

for filepath in INPUT_FILES:
    text    = Path(filepath).read_text(encoding='utf-8', errors='replace')
    entries = split_entries(text)
    print(f"  {filepath}: {len(entries)} entradas encontradas")

    accepted = skipped = 0
    skipped_entries = []
    for raw in entries:
        h = block_hash(raw)
        if h in _seen:
            continue
        _seen.add(h)

        main_doc, fem_doc = parse_entry(raw)

        if main_doc:
            lemma = main_doc['lemma']
            if lemma not in grouped and lemma not in _existing_lemmas:
                grouped[lemma] = main_doc
                accepted += 1
            elif lemma in grouped:
                # Fusiona solo si ya está en la sesión actual (homógrafos)
                existing_defs = {s['definition'] for s in grouped[lemma]['senses']}
                new_senses    = [s for s in main_doc['senses'] if s['definition'] not in existing_defs]
                if new_senses:
                    grouped[lemma]['senses'].extend(new_senses)
            # Si está en _existing_lemmas pero no en grouped → ya procesado, se omite
        else:
            skipped += 1
            skipped_entries.append(raw)

        if fem_doc:
            fl = fem_doc['lemma']
            if fl not in grouped and fl not in _existing_lemmas:
                grouped[fl] = fem_doc

    print(f"    → aceptadas: {accepted} | saltadas (sin acepciones): {skipped}")
    # Guardar entradas saltadas para revisión
    if skipped_entries:
        with open(SKIPPED_PATH, "a", encoding="utf-8") as sf:
            sf.write(f"\n### {filepath} ###\n")
            for entry in skipped_entries:
                sf.write(entry.strip() + "\n---\n")

# Escribir JSONL
mode    = 'a'  # siempre añade, nunca sobreescribe
written = 0

with open(OUT_PATH, mode, encoding='utf-8') as f:
    for lemma, doc in sorted(grouped.items()):
        # Renumera acepciones correlativamente (por si hay homógrafos fusionados)
        for idx, s in enumerate(doc['senses'], start=1):
            s['number'] = idx
        f.write(json.dumps(doc, ensure_ascii=False) + '\n')
        written += 1

print(f"\nEntradas escritas → {OUT_PATH}: {written}")

lengths: dict[int, int] = defaultdict(int)
for lm in grouped:
    lengths[len(lm)] += 1
print("\nDistribución por longitud:")
for l in sorted(lengths):
    bar = '█' * (lengths[l] // 5)
    print(f"  {l:2d} letras: {lengths[l]:5d}  {bar}")
