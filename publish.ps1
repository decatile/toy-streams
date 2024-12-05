param(
  [String] $Message,
  [String] $Version = "patch"
)
git stash
npm version $Version
git stash pop
git add .
git commit -m $Message
git push
npm publish
