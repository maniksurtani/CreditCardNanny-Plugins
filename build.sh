#!/bin/bash

rm *.zip *.xpi
rm -rf .target
mkdir .target
cp -r Chrome .target/
cp -r Common/* .target/Chrome/
cd .target/Chrome
VERSION=`cat ../../VERSION`
cat manifest.json | sed -e "s/<VERSION>/${VERSION}/g" > m2.json
mv m2.json manifest.json
jar cf ../../CreditCardNanny.zip *
cd ../..
rm -rf .target

