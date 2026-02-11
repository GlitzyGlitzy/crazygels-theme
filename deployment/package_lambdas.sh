#!/bin/bash
# Package Lambda functions for deployment
# Usage: ./deployment/package_lambdas.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/lambda"
OUTPUT_DIR="$SCRIPT_DIR/lambda"

echo "=== Packaging Lambda functions ==="

for func_dir in "$DEPLOY_DIR"/*/; do
    func_name=$(basename "$func_dir")
    echo ""
    echo "--- Packaging: $func_name ---"

    # Create a temp build directory
    build_dir="/tmp/lambda-build-$func_name"
    rm -rf "$build_dir"
    mkdir -p "$build_dir"

    # Install dependencies
    if [ -f "$func_dir/requirements.txt" ]; then
        pip install \
            --target "$build_dir" \
            --platform manylinux2014_x86_64 \
            --implementation cp \
            --python-version 3.11 \
            --only-binary=:all: \
            -r "$func_dir/requirements.txt" \
            --quiet
    fi

    # Copy handler code
    cp "$func_dir"/*.py "$build_dir/"

    # Create zip
    zip_path="$OUTPUT_DIR/${func_name}.zip"
    cd "$build_dir"
    zip -r "$zip_path" . -x '*.pyc' '__pycache__/*' '*.dist-info/*' --quiet
    cd -

    # Cleanup
    rm -rf "$build_dir"

    size=$(du -sh "$zip_path" | cut -f1)
    echo "  -> $zip_path ($size)"
done

echo ""
echo "=== All Lambda functions packaged ==="
ls -la "$OUTPUT_DIR"/*.zip 2>/dev/null || echo "No zip files created"
