#!/usr/bin/env python3

import os
import glob
import re
from datetime import datetime
from pathlib import Path

# Get the absolute path of the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Output file
STATS_FILE = PROJECT_ROOT / "STATISTICS.md"

# Project directories - now using absolute paths
PROJECT_DIRS = [
    PROJECT_ROOT / "src/config",
    PROJECT_ROOT / "src/controllers",
    PROJECT_ROOT / "src/middleware",
    PROJECT_ROOT / "src/models",
    PROJECT_ROOT / "src/routes",
    PROJECT_ROOT / "frontend/src/components",
    PROJECT_ROOT / "frontend/src/pages",
    PROJECT_ROOT / "frontend/src/store",
    PROJECT_ROOT / "frontend/src/types",
]

def get_gitignore_patterns():
    """Read patterns from .gitignore and convert them to regex patterns."""
    gitignore_path = PROJECT_ROOT / ".gitignore"
    patterns = []
    
    if gitignore_path.exists():
        with open(gitignore_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Skip negation patterns (lines starting with !)
                if line.startswith('!'):
                    continue
                # Convert glob pattern to regex pattern
                pattern = re.escape(line).replace(r'\*', '.*')
                patterns.append(pattern)
    
    return patterns

def get_stats_specific_patterns():
    """Get patterns specific to stats collection (non-gitignore patterns)."""
    return [
        re.escape(pattern).replace(r'\*', '.*')
        for pattern in [
            "*.min.*",
            "*.bundle.*",
            "vite-env.d.ts",
            "environment.d.ts",
        ]
    ]

def should_exclude_file(file_path, patterns):
    """Check if a file should be excluded based on patterns."""
    file_name = os.path.basename(file_path)
    relative_path = str(Path(file_path).relative_to(PROJECT_ROOT))
    
    return any(
        re.search(pattern, file_name) or re.search(pattern, relative_path)
        for pattern in patterns
    )

def analyze_gitignore_status():
    """Analyze files that match and don't match .gitignore patterns across the entire project."""
    gitignore_patterns = get_gitignore_patterns()
    matched_files = set()
    unmatched_files = set()

    # Walk through the entire project directory
    for root, _, files in os.walk(PROJECT_ROOT):
        for file in files:
            file_path = Path(root) / file
            try:
                relative_path = str(file_path.relative_to(PROJECT_ROOT))
                if should_exclude_file(file_path, gitignore_patterns):
                    matched_files.add(relative_path)
                else:
                    unmatched_files.add(relative_path)
            except Exception:
                continue
    
    return (
        len(matched_files), 
        sorted(matched_files),
        len(unmatched_files),
        sorted(unmatched_files)
    )

def count_stats(ext):
    """Count files and lines of code for a specific extension."""
    file_count = 0
    lines = 0
    exclude_patterns = get_gitignore_patterns() + get_stats_specific_patterns()

    for directory in PROJECT_DIRS:
        # Create the glob pattern
        pattern = os.path.join(directory, f"*.{ext}")
        
        # Use glob to find files matching the extension
        files = glob.glob(str(pattern))

        # Filter out excluded files
        filtered_files = [
            f for f in files
            if not should_exclude_file(f, exclude_patterns)
        ]
        
        file_count += len(filtered_files)

        for file_path in filtered_files:
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    if ext in ("js", "jsx", "ts", "tsx"):
                        lines += sum(
                            1
                            for line in file
                            if not re.match(r"^\s*//", line)
                            and not re.match(r"^\s*/\*", line)
                            and not re.match(r"^\s*\*", line)
                            and not line.strip() == ""
                        )
                    elif ext == "css":
                        lines += sum(
                            1
                            for line in file
                            if not re.match(r"^\s*/\*.*?\*/", line)
                            and not re.match(r"^\s*\*", line)
                            and not line.strip() == ""
                        )
                    else:
                        lines += sum(1 for line in file if line.strip())
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")

    return file_count, lines

def main():
    """Main function to collect and write statistics."""
    try:
        with open(STATS_FILE, "w", encoding="utf-8") as f:
            f.write("# Code Statistics\n")
            f.write(f"Generated on {datetime.now()}\n")
            f.write("Note: Only counting project-specific implementation files\n\n")

            total_files = 0
            total_lines = 0

            # Analyze .gitignore status
            matched_count, matched_files, unmatched_count, unmatched_files = analyze_gitignore_status()
            f.write("## Files Status According to .gitignore\n")
            f.write(f"- Files that MATCH .gitignore patterns (excluded): {matched_count}\n")
            f.write(f"- Files that DO NOT match .gitignore (tracked): {unmatched_count}\n")
            f.write("\nNote: These counts include ALL files in the workspace, not just implementation files.\n\n")

            file_types = ["js", "jsx", "ts", "tsx", "css"]
            for ext in file_types:
                files, lines = count_stats(ext)
                total_files += files
                total_lines += lines

                f.write(f"## .{ext} files\n")
                f.write(f"- Number of files: {files}\n")
                f.write(f"- Lines of code: {lines}\n\n")

            f.write("## Summary\n\n")
            f.write("## Totals\n")
            f.write(f"- Total number of implementation files: {total_files}\n")
            f.write(f"- Total lines of code: {total_lines}\n")
            f.write(f"- Total workspace files matched by .gitignore: {matched_count}\n")
            f.write(f"- Total workspace files NOT matched by .gitignore: {unmatched_count}\n")

        print(f"Statistics have been written to {STATS_FILE}")
    except PermissionError as e:
        print(f"Error: Permission denied when writing to {STATS_FILE}")
        print("Try running the script with appropriate permissions")
        raise
    except Exception as e:
        print(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    main()