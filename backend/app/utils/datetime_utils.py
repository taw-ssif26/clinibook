from datetime import date, time, datetime, timedelta, timezone
from typing import List, Tuple


def combine_utc(d: date, t: time) -> datetime:
    return datetime.combine(d, t, tzinfo=timezone.utc)


def generate_slots(
    start: time,
    end: time,
    slot_duration: int,
    buffer: int,
) -> List[Tuple[time, time]]:
    """
    Generate all (start_time, end_time) slot pairs between start and end.
    Each slot is slot_duration minutes. Buffer is added after each slot.
    """
    slots = []
    step = slot_duration + buffer
    current = datetime.combine(date.today(), start)
    end_dt = datetime.combine(date.today(), end)

    while True:
        slot_end = current + timedelta(minutes=slot_duration)
        if slot_end > end_dt:
            break
        slots.append((current.time(), slot_end.time()))
        current += timedelta(minutes=step)

    return slots


def slot_overlaps(
    start_a: time, end_a: time,
    start_b: time, end_b: time,
) -> bool:
    """Returns True if two time slots overlap."""
    return start_a < end_b and end_a > start_b
