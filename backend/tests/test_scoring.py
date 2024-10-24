import pytest
from app.utils.scoring import calculate_score

def test_calculate_score_within_limits():
    score = calculate_score(100, 95, 300, 180)
    assert score == 78.5

def test_calculate_score_over_price():
    score = calculate_score(100, 105, 300, 180)
    assert score == 18.0  # Closeness score is 0

def test_calculate_score_over_time():
    score = calculate_score(100, 95, 300, 320)
    assert score == 66.5  # Time score is 0
