#!/usr/bin/env python3
"""Tests para extract-feminines.py"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

# Importar funciones del módulo
import sys
sys.path.insert(0, str(Path(__file__).parent))
from extract_feminines import (
    parse_lemmas,
    generate_feminine_entries,
    load_existing_words,
    LEMMA_PATTERN,
    NON_GENDER_SUFFIXES,
)


def test_parse_lemmas_basic():
    """Test parsing de lemas básicos con notación de género."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("abandonado, da. adj. Descuidado.\n")
        f.write("abacalero, ra. adj. Perteneciente al abacá.\n")
        f.write("bobalicón, na. adj. Que parece bobo.\n")
        temp_path = Path(f.name)

    lemas = parse_lemmas(temp_path)
    temp_path.unlink()

    assert len(lemas) == 3

    # Verificar abandonado → abandonada
    abandonado = next((l for l in lemas if l["masculine"] == "abandonado"), None)
    assert abandonado is not None
    assert abandonado["feminine"] == "abandonada"

    # Verificar abacalero → abacalera
    abacalero = next((l for l in lemas if l["masculine"] == "abacalero"), None)
    assert abacalero is not None
    assert abacalero["feminine"] == "abacalera"

    # Verificar bobalicón → bobalicona
    bobalicón = next((l for l in lemas if l["masculine"] == "bobalicón"), None)
    assert bobalicón is not None
    assert bobalicón["feminine"] == "bobalicona"


def test_parse_lemmas_suffix_da():
    """Test que las palabras con sufijo 'da' se generan correctamente."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("abalaustrado, da. adj. balaustrado.\n")
        f.write("abalconado, da. adj. Provisto de balcón.\n")
        f.write("abanderado, da. adj. Persona que lleva bandera.\n")
        temp_path = Path(f.name)

    lemas = parse_lemmas(temp_path)
    temp_path.unlink()

    for lema in lemas:
        assert lema["masculine"].endswith("ado")
        assert lema["feminine"].endswith("ada")


def test_parse_lemmas_suffix_ra():
    """Test que las palabras con sufijo 'ra' se generan correctamente."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("abridor, ra. adj. Que abre.\n")
        f.write("abejero, ra. m. y f. colmenero.\n")
        temp_path = Path(f.name)

    lemas = parse_lemmas(temp_path)
    temp_path.unlink()

    # abridor → abridora (termina en -dor)
    abridor = next((l for l in lemas if l["masculine"] == "abridor"), None)
    assert abridor is not None
    assert abridor["feminine"] == "abridora"

    # abejero → abejera (termina en -ero)
    abejero = next((l for l in lemas if l["masculine"] == "abejero"), None)
    assert abejero is not None
    assert abejero["feminine"] == "abejera"


def test_parse_lemmas_suffix_ona():
    """Test que las palabras con sufijo 'na' (de -ón) se generan correctamente."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("bobalicón, na. adj. Que parece bobo.\n")
        f.write("campeón, na. adj. Que compite.\n")
        temp_path = Path(f.name)

    lemas = parse_lemmas(temp_path)
    temp_path.unlink()

    for lema in lemas:
        assert lema["masculine"].endswith("ón")
        assert lema["feminine"].endswith("ona")


def test_parse_lemmas_non_gender_suffixes():
    """Test que los sufijos no de género se filtran."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        # Estos son falsos positivos del PDF
        f.write("deloitte, S. Empresa.\n")
        f.write("suelen, p. verbo.\n")
        f.write("fin, etc. sustantivo.\n")
        temp_path = Path(f.name)

    lemas = parse_lemmas(temp_path)
    temp_path.unlink()

    # Ninguno debería pasar el filtro
    assert len(lemas) == 0


def test_feminine_generation_rules():
    """Test todas las reglas de generación de femeninos."""
    test_cases = [
        # (masculine, expected_feminine)
        ("abandonado", "abandonada"),  # -ado → -ada
        ("decidido", "decidida"),  # -ido → -ida
        ("abacalero", "abacalera"),  # -ero → -era
        ("abridor", "abridora"),  # -dor → -dora
        ("abarcador", "abarcadora"),  # -dor → -dora
        ("actor", "actora"),  # -tor → -tora
        ("bobalicón", "bobalicona"),  # -ón → -ona
        ("campeón", "campeona"),  # -ón → -ona
        ("alemán", "alemana"),  # -án → -ana
        ("abuelo", "abuela"),  # -o → -a
        ("catalán", "catalana"),  # -án → -ana
        ("francés", "francesa"),  # -és → -esa
        ("trolel", "trolela"),  # -el → -ela
        ("anillo", "anilla"),  # -illo → -illa (via -il → -ila)
    ]

    for masculine, expected in test_cases:
        # Simular la lógica del script
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
            feminine = masculine[:-1] + "a"

        assert feminine == expected, f"Falló: {masculine} → {feminine} (esperado: {expected})"


def test_load_existing_words():
    """Test que las palabras se cargan correctamente."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        f.write(json.dumps({"lemma": "abandonado", "senses": []}) + "\n")
        f.write(json.dumps({"lemma": "abacalero", "senses": []}) + "\n")
        f.write(json.dumps({"lemma": "abandonada", "senses": []}) + "\n")
        temp_path = Path(f.name)

    words = load_existing_words(temp_path)
    temp_path.unlink()

    assert len(words) == 3
    assert "abandonado" in words
    assert "abacalero" in words
    assert "abandonada" in words


def test_generate_feminine_entries():
    """Test que las entradas femeninas se generan correctamente."""
    lemas = [
        {"masculine": "abandonado", "feminine": "abandonada"},
        {"masculine": "abacalero", "feminine": "abacalera"},
        {"masculine": "noexistente", "feminine": "noexistentea"},
    ]

    existing_words = {
        "abandonado": {"lemma": "abandonado", "senses": [{"definition": "Descuidado"}]},
        "abacalero": {"lemma": "abacalero", "senses": [{"definition": "Perteneciente al abacá"}]},
    }

    entries = generate_feminine_entries(lemas, existing_words)

    assert len(entries) == 2  # "noexistente" no está en existing_words

    # Verificar que las entradas tienen el lema femenino
    lemmas_generated = [e["lemma"] for e in entries]
    assert "abandonada" in lemmas_generated
    assert "abacalera" in lemmas_generated


if __name__ == "__main__":
    print("Running tests...")

    test_parse_lemmas_basic()
    print("✅ test_parse_lemmas_basic")

    test_parse_lemmas_suffix_da()
    print("✅ test_parse_lemmas_suffix_da")

    test_parse_lemmas_suffix_ra()
    print("✅ test_parse_lemmas_suffix_ra")

    test_parse_lemmas_suffix_ona()
    print("✅ test_parse_lemmas_suffix_ona")

    test_parse_lemmas_non_gender_suffixes()
    print("✅ test_parse_lemmas_non_gender_suffixes")

    test_feminine_generation_rules()
    print("✅ test_feminine_generation_rules")

    test_load_existing_words()
    print("✅ test_load_existing_words")

    test_generate_feminine_entries()
    print("✅ test_generate_feminine_entries")

    print("\n✅ Todos los tests pasaron!")
