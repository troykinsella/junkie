#!/usr/bin/env bash

set -e

if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then

  echo "Publishing generated documentation..."

  DIST_DIR="$(pwd)/dist"

  # Clone gh-pages
  cd
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "travis-ci"
  git clone --quiet --branch=gh-pages https://${GH_TOKEN}@github.com/troykinsella/junkie gh-pages > /dev/null

  # Update gh-pages
  cd gh-pages
  git rm -rf coverage > /dev/null
  git rm -rf docs > /dev/null
  cp -R $DIST_DIR/coverage coverage
  cp -R $DIST_DIR/docs docs

  # Commit and push changes
  git add -f .
  git commit -m "Generated docs for master build $TRAVIS_BUILD_NUMBER"
  git push -fq origin gh-pages > /dev/null

  echo "Successfully published generated documentation"
fi
