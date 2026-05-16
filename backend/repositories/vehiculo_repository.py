from database import Vehiculo
from .base_repository import BaseRepository

class VehiculoRepository(BaseRepository):
    def __init__(self):
        super().__init__(Vehiculo)

    def get_by_chofer_id(self, chofer_id):
        return self.model.query.filter_by(chofer_id=chofer_id).first()
