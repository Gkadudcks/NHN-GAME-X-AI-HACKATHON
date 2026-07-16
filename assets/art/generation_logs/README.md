# Generation logs

Store one JSON object per line in files ending in `.jsonl`. Copy the shape from `generation-log.example.jsonl`; do not edit old records after an asset is approved. Add a correction as a new log record and asset version.

Required reproducibility fields are: `log_id`, `asset_id`, `asset_version`, model name/version, prompt version and rendered prompt path, reference paths and strengths, seed, width/height, tool-specific settings, generation timestamp, and source output path. The validator checks log IDs linked by non-planned manifest versions.

