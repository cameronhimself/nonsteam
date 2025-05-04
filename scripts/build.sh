#!/usr/bin/bash

rm -rf dist 
npm run build:js

# Copy additional resources
mkdir -p dist/resources/regedit
cp -a node_modules/regedit/vbs dist/resources/regedit

npm run build:executable

