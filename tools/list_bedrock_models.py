#!/usr/bin/env python3
"""
List available AWS Bedrock foundation models to find valid model IDs.

Usage examples:
  python tools/list_bedrock_models.py --region us-east-1
  python tools/list_bedrock_models.py --region us-east-1 --provider Anthropic
  python tools/list_bedrock_models.py --region us-west-2 --modality TEXT

Notes:
  - Requires AWS credentials with permissions to call bedrock:ListFoundationModels
  - This lists model IDs you can reference as modelId in Bedrock Runtime
"""

from __future__ import annotations

import argparse
import sys
from typing import List

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception as exc:
    print("❌ boto3 is required. Run: pip install boto3", file=sys.stderr)
    raise


def main() -> int:
    parser = argparse.ArgumentParser(description="List AWS Bedrock models (modelId values)")
    parser.add_argument("--region", default="us-east-1", help="AWS region (default: us-east-1)")
    parser.add_argument("--provider", default=None, help="Filter by provider (e.g., Anthropic, Amazon, Cohere)")
    parser.add_argument(
        "--modality",
        default=None,
        help="Filter by output modality (e.g., TEXT, EMBEDDING, IMAGE, VIDEO)"
    )
    parser.add_argument("--limit", type=int, default=500, help="Max models to print (default: 500)")

    args = parser.parse_args()

    try:
        client = boto3.client("bedrock", region_name=args.region)
    except Exception as exc:
        print(f"❌ Failed to create Bedrock client in region {args.region}: {exc}", file=sys.stderr)
        return 2

    list_kwargs = {}
    if args.provider:
        list_kwargs["byProvider"] = args.provider
    if args.modality:
        list_kwargs["byOutputModality"] = args.modality

    try:
        resp = client.list_foundation_models(**list_kwargs)
        models: List[dict] = resp.get("modelSummaries", [])
    except (BotoCoreError, ClientError) as exc:
        print(f"❌ Error listing foundation models: {exc}", file=sys.stderr)
        return 3

    if not models:
        print("No models found with the given filters.")
        return 0

    # Sort for readability
    models.sort(key=lambda m: (m.get("providerName", ""), m.get("modelId", "")))

    print(f"Found {len(models)} models in {args.region}. Showing up to {args.limit}.")
    print("\nColumns: modelId | provider | modelName | outputModalities | inferenceTypes")
    print("-" * 120)

    count = 0
    for m in models:
        if count >= args.limit:
            break
        model_id = m.get("modelId", "")
        provider = m.get("providerName", "")
        name = m.get("modelName", "")
        modalities = ",".join(m.get("outputModalities", []) or [])
        inference = ",".join(m.get("inferenceTypesSupported", []) or [])
        print(f"{model_id} | {provider} | {name} | {modalities} | {inference}")
        count += 1

    print("\nTip: Use the exact 'modelId' value above in Bedrock Runtime 'modelId'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


