"""
Tests: Slot generation, exception overrides
Run: pytest tests/test_availability.py -v
"""
import pytest
from datetime import date, time
from app.utils.datetime_utils import generate_slots, slot_overlaps


def test_generate_slots_basic():
    slots = generate_slots(time(9, 0), time(11, 0), slot_duration=30, buffer=0)
    assert len(slots) == 4
    assert slots[0] == (time(9, 0), time(9, 30))
    assert slots[-1] == (time(10, 30), time(11, 0))


def test_generate_slots_with_buffer():
    slots = generate_slots(time(9, 0), time(11, 0), slot_duration=30, buffer=10)
    # Each step = 40min: 9:00, 9:40, 10:20 → 3 slots
    assert len(slots) == 3


def test_slot_overlaps_true():
    assert slot_overlaps(time(9, 0), time(9, 30), time(9, 15), time(9, 45)) is True


def test_slot_overlaps_false():
    assert slot_overlaps(time(9, 0), time(9, 30), time(9, 30), time(10, 0)) is False


def test_slot_overlaps_adjacent():
    # Adjacent slots do not overlap
    assert slot_overlaps(time(9, 0), time(9, 30), time(9, 30), time(10, 0)) is False
