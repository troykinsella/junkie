#/usr/bin/env sh

set -e

if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then

  echo "Publishing generated documentation..."

  cp -R coverage/ $HOME/coverage

  cd
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "travis-ci"
  git clone --quiet --branch=gh-pages https://${GH_TOKEN}@github.com/troykinsella/junkie gh-pages > /dev/null

  cd gh-pages
  git rm -rf coverage
  cp -R ~/coverage .

  git add -f .
  git commit -m "Generated docs for master build $TRAVIS_BUILD_NUMBER"
  git push -fq origin gh-pages > /dev/null

  echo "Successfully published generated documentation"
fi
