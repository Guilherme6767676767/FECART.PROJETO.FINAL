from app import db
from datetime import date

class OcorrenciaSeguranca(db.Model):
    __tablename__ = 'ocorrencias_seguranca'
    id = db.Column(db.Integer, primary_key=True)
    data_fato = db.Column(db.Date, nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    tipo_ocorrencia = db.Column(db.String(255), nullable=False)
    local = db.Column(db.String(255), nullable=False)
    fonte = db.Column(db.String(255), nullable=True)
    gravidade = db.Column(db.String(20), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "data_fato": self.data_fato.isoformat(),
            "cidade": self.cidade,
            "tipo_ocorrencia": self.tipo_ocorrencia,
            "local": self.local,
            "fonte": self.fonte,
            "gravidade": self.gravidade,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }
