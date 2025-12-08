# Release Preparation Script for Conan: The Hyborian Age v0.0.35
# This script creates a release package for GitHub

# Get the version from system.json
$systemJson = Get-Content "system.json" -Raw | ConvertFrom-Json
$version = $systemJson.version
$zipName = "conan-the-hyborian-age-v$version.zip"

Write-Host "Creating release package for version $version..." -ForegroundColor Cyan

# Create temporary directory for the release
$tempDir = ".\temp-release"
$releaseDir = "$tempDir\conan-the-hyborian-age"

# Remove temp directory if it exists
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

# Create the directory structure
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Write-Host "Copying files..." -ForegroundColor Yellow

# Copy all necessary files and directories
$itemsToCopy = @(
    "system.json",
    "template.json",
    "LICENSE.txt",
    "README.md",
    "CHANGELOG.md",
    "module",
    "assets",
    "lang",
    "styles",
    "templates"
)

foreach ($item in $itemsToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $releaseDir -Recurse -Force
        Write-Host "  ✓ Copied: $item" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $item" -ForegroundColor Red
    }
}

# Create the zip file
Write-Host "`nCreating ZIP archive..." -ForegroundColor Yellow
$zipPath = ".\$zipName"

# Remove existing zip if it exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create the zip
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipPath -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

# Display results
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "`n✓ Release package created successfully!" -ForegroundColor Green
Write-Host "  File: $zipName" -ForegroundColor Cyan
Write-Host "  Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push all changes to GitHub" -ForegroundColor White
Write-Host "2. Create a new release (tag: v$version) on GitHub" -ForegroundColor White
Write-Host "3. Upload $zipName to the release" -ForegroundColor White
Write-Host "4. Verify the download URL matches system.json" -ForegroundColor White
Write-Host "`nGitHub Release URL:" -ForegroundColor Yellow
Write-Host "  https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/new" -ForegroundColor Cyan
