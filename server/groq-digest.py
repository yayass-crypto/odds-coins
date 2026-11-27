#!/usr/bin/env python3
"""Groq digest fallback (Odds & Coins server).

Same credential pattern as the custom.groq helper: the key never appears
here, in argv, env or logs — dynamic_credentials swaps in a surrogate that
authd resolves on the approved request to api.groq.com.

Usage: groq-digest.py "<prompt>"
Prints {"digest": "<text>"} on stdout; exits non-zero on failure.

NOTE: gpt-oss-20b spends its whole token budget on chain-of-thought
reasoning unless reasoning_effort is "low" — without it the model returns
empty content with finish_reason "length" (verified 27 Nov 2026: 1022/1024
reasoning tokens, content ""). With reasoning_effort "low" it returns a
3-sentence digest in ~94 tokens.
"""
import json
import sys
import urllib.request

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

BASE = "https://api.groq.com/openai/v1"
CONNECTION = "custom.groq"
ALLOWED_HOSTS = ["api.groq.com"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused")


def main(argv):
    if len(argv) != 2:
        print("usage: groq-digest.py \"<prompt>\"", file=sys.stderr)
        return 2
    request = urllib.request.Request(BASE + "/chat/completions")
    request.add_header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")
    add_surrogate_to_request(request, CONNECTION, allowed_hosts=ALLOWED_HOSTS)
    data = json.dumps({
        "model": "openai/gpt-oss-20b",
        "messages": [{"role": "user", "content": argv[1]}],
        "max_tokens": 512,
        "temperature": 0.7,
        "reasoning_effort": "low",
    }).encode("utf-8")
    request.add_header("Content-Type", "application/json")
    with urllib.request.build_opener(NoRedirect()).open(request, data=data, timeout=60) as response:
        out = read_json_response(response)
    text = ""
    if out and out.get("choices"):
        msg = out["choices"][0].get("message") or {}
        text = str(msg.get("content") or "").strip()
    if not text:
        print("groq-digest.py: empty completion", file=sys.stderr)
        return 1
    print(json.dumps({"digest": text}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
