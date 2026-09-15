import pandas as pd
from pathlib import Path
from typing import List, Dict

# Path to the Excel file (adjust if needed)
EXCEL_FILE = Path(__file__).parent.parent / "OcorrenciaMensal_Criminal_Grande_Sao_Paulo.xlsx"

# List of month column names expected in the Excel sheets
MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

def _load_excel() -> List[Dict]:
    """Read the Excel workbook and convert each cell into a record.

    Returns:
        List[Dict]: List of dictionaries with keys ``ano``, ``tipo_crime``, ``mes`` and ``quantidade``.
    """
    # Load all sheets; ``sheet_name=None`` returns a dict {sheet_name: DataFrame}
    xl = pd.read_excel(EXCEL_FILE, sheet_name=None, engine="openpyxl")
    records: List[Dict] = []
    for sheet_name, df in xl.items():
        # The sheet name is the year (e.g., "2025")
        try:
            ano = int(sheet_name)
        except ValueError:
            # Skip sheets that are not numeric years
            continue
        # Ensure column names are stripped of whitespace
        df = df.rename(columns=lambda c: c.strip() if isinstance(c, str) else c)
        for _, row in df.iterrows():
            tipo_crime = str(row.get("Natureza", "")).strip()
            if not tipo_crime:
                continue
            for mes in MONTHS:
                quantidade = row.get(mes, 0)
                # NaNs become 0
                if pd.isna(quantidade):
                    quantidade = 0
                try:
                    quantidade = int(quantidade)
                except (ValueError, TypeError):
                    quantidade = 0
                records.append({
                    "ano": ano,
                    "tipo_crime": tipo_crime,
                    "mes": mes,
                    "quantidade": quantidade,
                })
    return records

# Load once at import time – the dataset is small enough for in‑memory use.
CRIME_RECORDS = _load_excel()
