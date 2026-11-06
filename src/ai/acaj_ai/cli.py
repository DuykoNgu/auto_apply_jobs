import argparse
import sys

from acaj_ai.eval_runner import run_cv_parse


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="acaj-ai")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("eval")
    parser.parse_args(argv)

    results = run_cv_parse()
    for result in results:
        for problem in result.problems:
            print(f"FAIL {result.name}: {problem}", file=sys.stderr)
    passed = sum(result.passed for result in results)
    print(f"cv-parse (stub): {passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1
