#!/bin/bash

BUILD=true
CLEAN=true

if [ "${1}" = "dev" ] ; then 
  CLEAN=false
elif [ "${1}" = "clean" ] ; then
  BUILD=false 
fi

if [ $CLEAN = true ] ; then
  rm *.zip *.xpi > /dev/null 2>&1
  rm -rf target > /dev/null 2>&1
fi

if [ $BUILD = true ] ; then
  mkdir target
  cp -r Chrome target/
  cp -r Common/* target/Chrome/
  cd target/Chrome
  VERSION=`cat ../../VERSION`
  cat manifest.json | sed -e "s/<VERSION>/${VERSION}/g" > m2.json
  mv m2.json manifest.json
  jar cf ../../CreditCardNanny.zip *
  cd ../..
fi

if [ $CLEAN = true ] ; then
  rm -rf target > /dev/null 2>&1
fi

