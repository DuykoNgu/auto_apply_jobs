from acaj_ai.masking import mask_pii

TEXT = "An Nguyen\nan@example.com +84 912 345 678"


def test_mask_hides_email_and_phone_and_restore_brings_them_back() -> None:
    masked = mask_pii(TEXT)
    assert "an@example.com" not in masked.text
    assert "912" not in masked.text
    assert masked.restore(masked.text) == TEXT
