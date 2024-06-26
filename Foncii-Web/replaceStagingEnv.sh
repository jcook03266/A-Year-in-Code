#!/usr/bin/env bash

> .env
while IFS= read -r line; do
  if [[ $line == *"env_variables"* ]]; then
    in_env_section=true
    indentation=$(echo "$line" | grep -o '^ *')
  elif [[ $in_env_section == true && ! "$line" =~ ^[[:space:]]*$ && ! "$line" =~ ^[[:space:]]*# && $(echo "$line" | grep -o '^ *' | wc -c) -gt ${#indentation} ]]; then
    key=$(echo $line | cut -d':' -f1 | awk '{$1=$1};1')
    value=$(echo $line | cut -d':' -f2- | awk '{$1=$1};1')
    echo "$key=$value" >> .env
  elif [[ $(echo "$line" | grep -o '^ *' | wc -c) -le ${#indentation} ]]; then
    in_env_section=false
  fi
done < staging-app.yaml

printf 'make sure to undo changes to the .env as it is being overwritten\n'