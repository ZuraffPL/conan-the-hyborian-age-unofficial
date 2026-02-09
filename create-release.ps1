# Release Preparation Script for Conan: The Hyborian Age v0.0.35
# This script creates a release package for GitHub

# Get the version from system.json
$systemJson = Get-Content "system.json" -Raw | ConvertFrom-Json
$version = $systemJson.version
$zipNameVersioned = "conan-the-hyborian-age-v$version.zip"
$zipNameLatest = "conan-the-hyborian-age.zip"

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
Write-Host "`nCreating ZIP archives..." -ForegroundColor Yellow

# Versioned zip (for GitHub release assets)
$zipPathVersioned = ".\$zipNameVersioned"
if (Test-Path $zipPathVersioned) {
    Remove-Item $zipPathVersioned -Force
}
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipPathVersioned -Force
Write-Host "  ✓ Created: $zipNameVersioned" -ForegroundColor Green

# Latest zip (for Foundry auto-updates)
$zipPathLatest = ".\$zipNameLatest"
if (Test-Path $zipPathLatest) {
    Remove-Item $zipPathLatest -Force
}
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipPathLatest -Force
Write-Host "  ✓ Created: $zipNameLatest" -ForegroundColor Green

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

# Display results
$zipSizeVersioned = (Get-Item $zipPathVersioned).Length / 1MB
$zipSizeLatest = (Get-Item $zipPathLatest).Length / 1MB
Write-Host "`n✓ Release packages created successfully!" -ForegroundColor Green
Write-Host "  Versioned: $zipNameVersioned ($([math]::Round($zipSizeVersioned, 2)) MB)" -ForegroundColor Cyan
Write-Host "  Latest:    $zipNameLatest ($([math]::Round($zipSizeLatest, 2)) MB)" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push all changes to GitHub" -ForegroundColor White
Write-Host "2. Create a new release (tag: v$version) on GitHub" -ForegroundColor White
Write-Host "3. Upload ALL assets to the release:" -ForegroundColor White
Write-Host "   - $zipNameVersioned (versioned archive)" -ForegroundColor Gray
Write-Host "   - $zipNameLatest (for Foundry auto-updates)" -ForegroundColor Gray
Write-Host "   - system.json (manifest for Foundry VTT)" -ForegroundColor Gray
Write-Host "4. Verify the download URL matches system.json" -ForegroundColor White
Write-Host "`nQuick release command:" -ForegroundColor Yellow
Write-Host "  git add -A && git commit -m 'v$version' && git push origin main" -ForegroundColor Cyan
Write-Host "  git tag v$version && git push origin v$version" -ForegroundColor Cyan
Write-Host "  gh release create v$version --title 'v$version' --notes-file CHANGELOG.md $zipNameVersioned $zipNameLatest system.json" -ForegroundColor Cyan
Write-Host "`nGitHub Release URL:" -ForegroundColor Yellow
Write-Host "  https://github.com/ZuraffPL/conan-the-hyborian-age-unofficial/releases/new" -ForegroundColor Cyan
