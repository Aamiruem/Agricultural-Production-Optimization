# Local intelligence — live data check

Run: 2026-11-14 14:12 UTC with `python scripts/check_local_intel_live.py`. Each row is what the real services returned for that point; failures are shown as failures.

| Region | Point | Boundaries (state / district / tehsil) | OSM place | Weather now | ERA5 history | SoilGrids (0–30 cm) | Dataset match (state level) |
|---|---|---|---|---|---|---|---|
| Punjab | 30.8, 75.7 | Punjab / Ludhiana / Ludhiana (West) | Dhaipai | 21.3 °C, RH 60%, 7-day rain 0.1 mm | 10 yrs, mean 781 mm/yr | pH 7.8, clay 26.0%, SOC 9.9 g/kg | 397 records (state), dataset rain 586 mm, match 47.4% over 38.0% |
| Haryana | 29.4, 76.4 | Haryana / Jind / Jind | Jind | 22.5 °C, RH 61%, 7-day rain 0.7 mm | 10 yrs, mean 615 mm/yr | pH 8.3, clay 23.2%, SOC 7.9 g/kg | 631 records (state), dataset rain 427 mm, match 47.4% over 38.0% |
| Bihar | 25.9, 85.6 | Bihar / Vaishali / Patepur | Patepur | 23.9 °C, RH 65%, 7-day rain 0.2 mm | 10 yrs, mean 1360 mm/yr | pH 7.0, clay 26.5%, SOC 12.5 g/kg | 896 records (state), dataset rain 1195 mm, match 63.6% over 38.0% |
| Uttar Pradesh | 26.85, 80.4 | Uttar Pradesh / Unnao / Safipur | Kursath | 23.4 °C, RH 59%, 7-day rain 0.6 mm | 10 yrs, mean 1005 mm/yr | pH 7.4, clay 28.5%, SOC 12.0 g/kg | 825 records (state), dataset rain 793 mm, match 52.3% over 38.0% |
| Rajasthan | 26.3, 73.5 | Rajasthan / Jodhpur / Bilara | Sindhiyon Ki Dhani | 24.6 °C, RH 40%, 7-day rain 0 mm | 10 yrs, mean 478 mm/yr | pH 7.8, clay 21.0%, SOC 5.1 g/kg | 0 records (None), dataset rain — mm, match None% over 0.0% |
| Maharashtra | 19.7, 75.3 | Maharashtra / Aurangabad / Paithan | Bidkin | 23.4 °C, RH 55%, 7-day rain 0 mm | 10 yrs, mean 1031 mm/yr | pH 7.4, clay 48.8%, SOC 9.1 g/kg | 770 records (state), dataset rain 1151 mm, match 65.8% over 38.0% |
| Madhya Pradesh | 23.2, 77.1 | Madhya Pradesh / Sehore / Sehore | Sehore | 22.2 °C, RH 55%, 7-day rain 0 mm | 10 yrs, mean 1419 mm/yr | pH 7.3, clay 42.3%, SOC 8.4 g/kg | 845 records (state), dataset rain 1048 mm, match 47.4% over 38.0% |
| Gujarat | 22.7, 72.2 | Gujarat / Ahmadabad / Bavla | Bavla Taluka | 27.1 °C, RH 41%, 7-day rain 0 mm | 10 yrs, mean 1056 mm/yr | pH 7.3, clay 27.7%, SOC 12.3 g/kg | 817 records (state), dataset rain 815 mm, match 50.1% over 38.0% |
| West Bengal | 23.2, 88.1 | West Bengal / Purba Bardhaman / Memari - I | Memari | 24.1 °C, RH 66%, 7-day rain 9.9 mm | 10 yrs, mean 1832 mm/yr | pH 6.4, clay 35.7%, SOC 14.7 g/kg | 1094 records (state), dataset rain 1796 mm, match 76.4% over 38.0% |
| Karnataka | 15.4, 75.0 | Karnataka / Dharwad / Dharwad | Yarikoppa | 24.3 °C, RH 47%, 7-day rain 0 mm | 10 yrs, mean 1383 mm/yr | pH 6.7, clay 33.4%, SOC 13.3 g/kg | 1432 records (state), dataset rain 1147 mm, match 57.4% over 38.0% |
| Tamil Nadu | 10.8, 79.3 | Tamil Nadu / Thanjavur / Papanasam | Keelakovilpattu | 26.1 °C, RH 87%, 7-day rain 2.2 mm | 10 yrs, mean 1332 mm/yr | pH 6.8, clay 37.5%, SOC 23.4 g/kg | 822 records (state), dataset rain 971 mm, match 47.4% over 38.0% |
| Kerala | 10.3, 76.4 | Kerala / Thrissur / Mukundapuram | Adichily | 27.3 °C, RH 79%, 7-day rain 7.6 mm | 10 yrs, mean 3698 mm/yr | pH 5.4, clay 32.9%, SOC 26.4 g/kg | 534 records (state), dataset rain 2924 mm, match 52.5% over 38.0% |
| Assam | 26.3, 92.2 | Assam / Morigaon / Mayong | Mayong | 22.6 °C, RH 77%, 7-day rain 1.9 mm | 10 yrs, mean 2589 mm/yr | pH 5.8, clay 31.2%, SOC 15.1 g/kg | 731 records (state), dataset rain 2155 mm, match 57.8% over 38.0% |
| Punjab (urban Ludhiana) | 30.901, 75.8573 | Punjab / Ludhiana / Ludhiana (West) | Ludhiana | 22.4 °C, RH 58%, 7-day rain 1.4 mm | 10 yrs, mean 774 mm/yr | no data (masked) | 397 records (state), dataset rain 586 mm, match 48.2% over 38.0% |

Dataset match uses only location and annual rainfall here (no soil test or crop list), so coverage is low by design.
Not tested live: AGMARKNET mandi prices (needs `DATA_GOV_IN_API_KEY`).
