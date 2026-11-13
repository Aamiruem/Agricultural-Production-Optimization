"""Reference agronomic profiles for 22 crops grown in India.

Values are approximate mean growing conditions taken from the public
"Crop Recommendation" dataset (N, P, K soil ratios; temperature in °C;
relative humidity in %; soil pH; rainfall in mm). They are used as the
fallback recommender when no trained ML model is available, and as the
nutrient targets for fertilizer recommendations.
"""
from dataclasses import asdict, dataclass

FEATURES = ("N", "P", "K", "temperature", "humidity", "ph", "rainfall")


@dataclass(frozen=True)
class CropProfile:
    name: str
    season: str  # kharif | rabi | zaid | perennial
    category: str  # cereal | pulse | fruit | fibre | plantation
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

    def to_dict(self) -> dict:
        return asdict(self)

    def features(self) -> tuple[float, ...]:
        return tuple(getattr(self, f) for f in FEATURES)


CROPS: dict[str, CropProfile] = {
    c.name: c
    for c in [
        CropProfile("rice", "kharif", "cereal", 80, 48, 40, 23.7, 82.3, 6.4, 236.2),
        CropProfile("maize", "kharif", "cereal", 78, 48, 20, 22.4, 65.1, 6.2, 84.8),
        CropProfile("chickpea", "rabi", "pulse", 40, 68, 80, 18.9, 16.9, 7.3, 80.1),
        CropProfile("kidneybeans", "rabi", "pulse", 21, 68, 20, 20.1, 21.6, 5.7, 105.9),
        CropProfile("pigeonpeas", "kharif", "pulse", 21, 68, 20, 27.7, 48.1, 5.8, 149.5),
        CropProfile("mothbeans", "kharif", "pulse", 21, 48, 20, 28.2, 53.2, 6.8, 51.2),
        CropProfile("mungbean", "zaid", "pulse", 21, 47, 20, 28.5, 85.5, 6.7, 48.4),
        CropProfile("blackgram", "kharif", "pulse", 40, 68, 19, 30.0, 65.1, 7.1, 67.9),
        CropProfile("lentil", "rabi", "pulse", 19, 68, 19, 24.5, 64.8, 6.9, 45.7),
        CropProfile("pomegranate", "perennial", "fruit", 19, 19, 40, 21.8, 90.1, 6.4, 107.5),
        CropProfile("banana", "perennial", "fruit", 100, 82, 50, 27.4, 80.4, 6.0, 104.6),
        CropProfile("mango", "perennial", "fruit", 20, 27, 30, 31.2, 50.2, 5.8, 94.7),
        CropProfile("grapes", "perennial", "fruit", 23, 133, 200, 23.8, 81.9, 6.0, 69.6),
        CropProfile("watermelon", "zaid", "fruit", 99, 17, 50, 25.6, 85.2, 6.5, 50.8),
        CropProfile("muskmelon", "zaid", "fruit", 100, 18, 50, 28.7, 92.3, 6.4, 24.7),
        CropProfile("apple", "perennial", "fruit", 21, 134, 200, 22.6, 92.3, 5.9, 112.7),
        CropProfile("orange", "perennial", "fruit", 20, 17, 10, 22.8, 92.2, 7.0, 110.5),
        CropProfile("papaya", "perennial", "fruit", 50, 59, 50, 33.7, 92.4, 6.7, 142.6),
        CropProfile("coconut", "perennial", "plantation", 22, 17, 31, 27.4, 94.8, 6.0, 175.7),
        CropProfile("cotton", "kharif", "fibre", 118, 46, 20, 24.0, 79.8, 6.9, 80.4),
        CropProfile("jute", "kharif", "fibre", 78, 47, 40, 25.0, 79.6, 6.7, 174.8),
        CropProfile("coffee", "perennial", "plantation", 101, 29, 30, 25.5, 58.9, 6.8, 158.1),
    ]
}
