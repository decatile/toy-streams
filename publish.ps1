param(
  [String] $Message,
  [String] $Version = "patch"
)

function C {
  param (
    [String] $Call
  )
  Invoke-Expression $Call
  if ($LASTEXITCODE -ne 0) {
    throw "$Call failed with $LASTEXITCODE"
  }
}

if ($Message -eq "") {
  throw "-Message is required"
}

if ($Version -notin @("patch", "minor", "major")) {
  throw "-Version should be 'patch', 'minor' or 'major'"
}

C "git stash"
C "npm version $Version"
C "git stash pop"
C "git add ."
C "git commit -m '$Message'"
C "git push"
C "npm publish"
