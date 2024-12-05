param([String]$Message)
git stash
npm version patch
git stash pop
git add .
git commit -m $Message
git push
npm publish
