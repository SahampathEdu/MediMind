import re


def normalize_drug_name(name: str) -> str:
    """Lowercase, strip whitespace, remove extra spaces."""
    if not name:
        return ""
    name = name.strip().lower()
    name = re.sub(r"\s+", " ", name)
    return name
