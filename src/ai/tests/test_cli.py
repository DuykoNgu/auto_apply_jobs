from acaj_ai.cli import main


def test_eval_passes_every_case_in_stub_mode() -> None:
    assert main(["eval"]) == 0
