"""Local agriculture intelligence: location, weather, soil, dataset matching and data quality.

Each module talks to one concern; routes live in app/api/routes/local_intel.py. External
responses are never fabricated — upstream failures surface as HTTP errors with a reason.
"""
