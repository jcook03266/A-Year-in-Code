#!/bin/sh

# Initialize the code generation configuration JSON
./apollo-ios-cli init --schema-namespace FonciiSchema --module-type embeddedInTarget --target-name FonciiApollo

# Generate the required schema and GraphQL swift code
./apollo-ios-cli generate --ignore-version-mismatch

# To run, open the terminal in the parent folder of this script
# and type: `sh Foncii-GQL-CodeGen-Config-Script.sh`
