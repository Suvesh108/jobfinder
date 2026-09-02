import os
import yaml
from typing import List
from models import CompanyConfig

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "companies.yaml")

def load_companies_config() -> List[CompanyConfig]:
    if not os.path.exists(CONFIG_PATH):
        print(f"[Config] Warning: {CONFIG_PATH} not found.")
        return []
    
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            raw_companies = data.get("companies", [])
            return [CompanyConfig(**c) for c in raw_companies if c.get("enabled", True)]
    except Exception as e:
        print(f"[Config] Error reading companies.yaml: {e}")
        return []
