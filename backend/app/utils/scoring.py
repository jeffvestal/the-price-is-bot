# app/utils/scoring.py

def calculate_score(target_price, player_total_price, time_limit, time_taken):
    # Closeness Score
    if player_total_price <= target_price:
        closeness_score = (1 - (target_price - player_total_price) / target_price) * 70
    else:
        closeness_score = 0

    # Time Score
    if time_taken <= time_limit:
        time_score = (1 - (time_taken / time_limit)) * 30
    else:
        time_score = 0

    total_score = closeness_score + time_score
    return round(total_score, 2)
