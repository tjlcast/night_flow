#!/bin/bash


rm -rf dist machine_manager machine_node workflow_server requirements.txt
echo "Clean directory"

# Bash script to copy directories using cp command
# Purpose: Copy ../FlowForge/dist, ../machine_manager, ../machine_node and ../workflow_server to current directory

# Error handling
set -euo pipefail

# Get current script directory
current_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Define directories to copy (source:destination)
declare -a source_dirs=(
    "../FlowForge/dist:dist"
    "../machine_manager:machine_manager" 
    "../machine_node:machine_node" 
    "../workflow_server:workflow_server"
    "../requirements.txt:requirements.txt"
)

echo -e "\033[36mStarting directory copy to current location: $current_dir\033[0m"

echo "Copy log $(date)"

# Process each directory
for dir_pair in "${source_dirs[@]}"; do
    # Split source path and destination name
    IFS=":" read -r source_path dest_name <<< "$dir_pair"
    
    # Resolve full paths
    full_source_path=$(realpath -m "$current_dir/$source_path")
    full_dest_path="$current_dir/$dest_name"
    
    echo -e "\033[32mProcessing: $source_path -> $dest_name\033[0m"
    echo "Processing: $source_path -> $dest_name"
    
    # Check if source directory exists
    if [ ! -d "$full_source_path" ]; then
        echo -e "\033[33mWarning: Source directory not found - $full_source_path\033[0m"
        echo "Warning: Source directory not found - $full_source_path"
        continue
    fi
    
    # Perform copy using cp
    if ! cp -R -v "$full_source_path" "$full_dest_path" 2>&1; then
        echo -e "\033[31mError: Failed to copy $source_path\033[0m"
        echo "Error: Failed to copy $source_path"
    else
        echo -e "\033[32mSuccessfully copied: $dest_name\033[0m"
        echo "Successfully copied: $dest_name"
        
        # Show copy result
        echo "Copy result:" 
        ls -ld "$full_dest_path"
    fi
done

echo -e "\033[36mAll directory copy operations completed\033[0m"
echo "Operations completed at $(date)" 