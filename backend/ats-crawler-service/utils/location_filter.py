import re

INDIAN_CITIES_AND_REGIONS = [
    "india", "bengaluru", "bangalore", "hyderabad", "pune", "mumbai",
    "delhi", "new delhi", "ncr", "gurugram", "gurgaon", "noida",
    "chennai", "kolkata", "ahmedabad", "kochi", "cochin", "thiruvananthapuram",
    "trivandrum", "chandigarh", "jaipur", "indore", "surat", "vadodara",
    "bhubaneswar", "coimbatore", "mysuru", "mysore", "nagpur", "lucknow",
    "remote - india", "remote, india", "india (remote)", "remote (india)",
    "karnataka", "maharashtra", "telangana", "tamil nadu", "haryana", "uttar pradesh"
]

def is_india_location(location_str: str) -> bool:
    """
    Returns True if the location string matches Indian cities, regions, or India remote.
    Also accepts ambiguous or global remote if explicitly tagged with India.
    """
    if not location_str or not isinstance(location_str, str):
        return False
    
    loc_clean = location_str.strip().lower()
    
    # Check direct keywords
    for keyword in INDIAN_CITIES_AND_REGIONS:
        if keyword in loc_clean:
            return True
            
    # Also support general 'anywhere' / 'remote' if no specific foreign country is mentioned
    # But avoid US, UK, Canada, Germany, Singapore, etc.
    foreign_blacklist = ["usa", "united states", "uk", "united kingdom", "london", "canada", "toronto", "germany", "berlin", "singapore", "australia", "sydney", "dubai", "uae", "ireland", "dublin", "amsterdam", "poland"]
    for fb in foreign_blacklist:
        if fb in loc_clean and "india" not in loc_clean:
            return False
            
    return False
