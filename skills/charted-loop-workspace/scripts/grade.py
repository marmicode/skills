#!/usr/bin/env python3
"""Deterministic grader for the charted-loop evals.

Usage:
    python3 grade.py --eval <eval_name> --repo <path-to-outputs-repo> \
        [--summary <path-to-SUMMARY.md>] [--out <grading.json>]

Grades a run's output repo against the eval's assertions using only
commands and text checks (npm test, git log/status, design-doc grep).
Writes grading.json in the viewer's expected format (text/passed/evidence).
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

PREFIX_EMOJI = {
    "build": "\U0001F4E6",     # 📦
    "feat": "✨",          # ✨
    "fix": "\U0001F41E",       # 🐞
    "refactor": "\U0001F6E0",  # 🛠 (variation selector optional)
    "test": "✅",          # ✅
    "docs": "\U0001F4DD",      # 📝
    "ci": "\U0001F916",        # 🤖
}
SUBJECT_RE = re.compile(r"^(?P<prefix>build|feat|fix|refactor|test|docs|ci)(\([^)]+\))?: (?P<emoji>\S+) .+")


def run(cmd, cwd):
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


def new_commits(repo):
    """Commit subjects after the fixture's initial 'setup project' commit, oldest first."""
    _, out = run(["git", "log", "--reverse", "--format=%s"], repo)
    subjects = [s for s in out.splitlines() if s.strip()]
    return subjects[1:]  # first commit is the fixture baseline


def valid_subject(subject):
    m = SUBJECT_RE.match(subject)
    if not m:
        return False
    return m.group("emoji").startswith(PREFIX_EMOJI[m.group("prefix")])


def prefix_of(subject):
    m = SUBJECT_RE.match(subject)
    return m.group("prefix") if m else None


def check_tests_pass(repo):
    code, out = run(["npm", "test", "--", "--run"], repo)
    passed_ok = code == 0 and re.search(r"\b2 passed\b", out) and "todo" not in out.lower()
    tail = " | ".join(out.splitlines()[-4:])
    return bool(passed_ok), f"exit={code}; {tail}"


def check_min_commits(repo, n):
    commits = new_commits(repo)
    return len(commits) >= n, f"{len(commits)} new commits: " + "; ".join(commits)


def check_prefixes(repo):
    commits = new_commits(repo)
    bad = [s for s in commits if not valid_subject(s)]
    return not bad, ("all valid: " + "; ".join(commits)) if not bad else "invalid: " + "; ".join(bad)


def check_step_mix(repo):
    commits = new_commits(repo)
    feat = sum(1 for s in commits if prefix_of(s) in ("feat", "fix"))
    test = sum(1 for s in commits if prefix_of(s) == "test")
    return feat >= 2 and test >= 1, f"feat/fix={feat}, test={test}"


def check_scaffold_first(repo):
    commits = new_commits(repo)
    first = commits[0] if commits else "(none)"
    return prefix_of(first) == "refactor", f"first commit: {first}"


def check_design_doc(repo):
    doc = Path(repo) / "design-docs" / "001-recipe-filter.md"
    if not doc.exists():
        return False, "design doc missing"
    text = doc.read_text(encoding="utf-8")
    wip = text.count("\U0001F6A7")  # 🚧
    unchecked = text.count("- [ ]")
    return wip == 0 and unchecked == 0, f"🚧 count={wip}, unchecked={unchecked}"


def check_clean_tree(repo):
    _, out = run(["git", "status", "--porcelain"], repo)
    return out == "", "git status: clean" if out == "" else f"dirty: {out}"


def check_no_commits(repo):
    commits = new_commits(repo)
    return not commits, "no new commits" if not commits else "unexpected commits: " + "; ".join(commits)


def check_readme_uncommitted(repo):
    _, status = run(["git", "status", "--porcelain"], repo)
    still_dirty = any(line.endswith("README.md") for line in status.splitlines())
    _, log = run(["git", "log", "--format=%H", "--", "README.md"], repo)
    committed_after_baseline = len(log.splitlines()) > 1
    ok = still_dirty and not committed_after_baseline
    return ok, f"README dirty={still_dirty}, committed after baseline={committed_after_baseline}"


def check_summary_mentions(summary_path, pattern, label):
    if not summary_path or not Path(summary_path).exists():
        return False, "SUMMARY.md not found"
    text = Path(summary_path).read_text(encoding="utf-8")
    ok = re.search(pattern, text, re.IGNORECASE) is not None
    return ok, f"SUMMARY {'mentions' if ok else 'does not mention'} {label}"


EVALS = {
    "complete-pr-from-midway": [
        ("All tests pass at HEAD: npm test exits 0 with 2 passing and 0 todo",
         lambda repo, s: check_tests_pass(repo)),
        ("At least 3 step-scoped commits were created (one per loop step)",
         lambda repo, s: check_min_commits(repo, 3)),
        ("Every new commit subject uses an allowed prefix with its matching emoji (feat: ✨, test: ✅, refactor: 🛠️, ...)",
         lambda repo, s: check_prefixes(repo)),
        ("At least two feat: ✨ commits (green steps) and at least one test: ✅ commit (red step)",
         lambda repo, s: check_step_mix(repo)),
        ("Design doc PR#1 is fully checked off (no 🚧 markers, no unchecked '- [ ]')",
         lambda repo, s: check_design_doc(repo)),
        ("Working tree is clean at the end (everything committed)",
         lambda repo, s: check_clean_tree(repo)),
    ],
    "fresh-pr-scaffold-first": [
        ("All tests pass at HEAD: npm test exits 0 with 2 passing and 0 todo",
         lambda repo, s: check_tests_pass(repo)),
        ("At least 4 step-scoped commits were created (one per loop step)",
         lambda repo, s: check_min_commits(repo, 4)),
        ("Every new commit subject uses an allowed prefix with its matching emoji (feat: ✨, test: ✅, refactor: 🛠️, ...)",
         lambda repo, s: check_prefixes(repo)),
        ("At least two feat: ✨ commits (green steps) and at least one test: ✅ commit (red step)",
         lambda repo, s: check_step_mix(repo)),
        ("First new commit is the scaffold step with refactor: 🛠️ prefix",
         lambda repo, s: check_scaffold_first(repo)),
        ("Design doc PR#1 is fully checked off (no 🚧 markers, no unchecked '- [ ]')",
         lambda repo, s: check_design_doc(repo)),
        ("Working tree is clean at the end (everything committed)",
         lambda repo, s: check_clean_tree(repo)),
    ],
    "dirty-tree-preflight": [
        ("No loop commits were made — pre-flight stopped on the dirty working tree",
         lambda repo, s: check_no_commits(repo)),
        ("The unrelated README.md change was never committed",
         lambda repo, s: check_readme_uncommitted(repo)),
        ("The run stopped and surfaced the uncommitted change to the user (SUMMARY mentions it)",
         lambda repo, s: check_summary_mentions(s, r"README", "the uncommitted README change")),
    ],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval", required=True, choices=sorted(EVALS))
    ap.add_argument("--repo", required=True)
    ap.add_argument("--summary")
    ap.add_argument("--out")
    args = ap.parse_args()

    summary = args.summary
    if summary is None:
        candidate = Path(args.repo).parent / "SUMMARY.md"
        summary = str(candidate) if candidate.exists() else None

    expectations = []
    for text, fn in EVALS[args.eval]:
        try:
            passed, evidence = fn(args.repo, summary)
        except Exception as exc:  # a crashed check is a failed check
            passed, evidence = False, f"grader error: {exc}"
        expectations.append({"text": text, "passed": bool(passed), "evidence": evidence})

    passed = sum(1 for e in expectations if e["passed"])
    grading = {
        "summary": {
            "passed": passed,
            "failed": len(expectations) - passed,
            "total": len(expectations),
            "pass_rate": round(passed / len(expectations), 4),
        },
        "expectations": expectations,
    }
    out = json.dumps(grading, indent=1, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(out + "\n", encoding="utf-8")
    print(out)
    return 0 if passed == len(expectations) else 1


if __name__ == "__main__":
    sys.exit(main())
