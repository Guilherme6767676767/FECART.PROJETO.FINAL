from fastapi.responses import HTMLResponse
from .data_loader import CRIME_RECORDS

def generate_alerts_html() -> str:
    """Generate a simple HTML page with GitHub‑style alerts for each record.
    
    Each alert shows the year, crime type, month and quantity.
    """
    # Header
    html = ["<html><head><title>Alertas de Crimes</title>",
            "<style>",
            ".alert {padding: 10px; margin: 5px 0; border-radius: 5px;}",
            ".alert-info {background-color:#e7f3fe; border-left:6px solid #2196F3;}",
            ".alert-success {background-color:#d4edda; border-left:6px solid #28a745;}",
            ".alert-warning {background-color:#fff3cd; border-left:6px solid #ffc107;}",
            ".alert-danger {background-color:#f8d7da; border-left:6px solid #dc3545;}",
            "</style></head><body>",
            "<h2>Alertas de Crimes (dados da planilha)</h2>"]
    # Simple colour cycle
    classes = ["alert-info", "alert-success", "alert-warning", "alert-danger"]
    for i, rec in enumerate(CRIME_RECORDS):
        cls = classes[i % len(classes)]
        msg = f"Ano {rec['ano']} – {rec['tipo_crime']} – {rec['mes']}: {rec['quantidade']} ocorrências"
        html.append(f"<div class='alert {cls}'>{msg}</div>")
    html.append("</body></html>")
    return "\n".join(html)
