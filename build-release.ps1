$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectDir 'VERSION') -Raw).Trim()
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid release version.' }
$files = @(Get-Content -LiteralPath (Join-Path $projectDir 'release-files.json') -Raw | ConvertFrom-Json)
$items = foreach ($file in $files) {
    if ($file -match '(^|/)\.\.?(/|$)|\\|:|^/') { throw "Invalid release path: $file" }
    $resolved = Join-Path $projectDir $file
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) { throw "Missing release file: $file" }
    $resolved
}
$releaseDir = Join-Path $projectDir 'dist'
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$archivePath = Join-Path $releaseDir "report-studio-v$version.zip"
# Zip entries use the explicit manifest, preserving relative paths without copying a workspace tree.
Add-Type -AssemblyName System.IO.Compression
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    for ($i = 0; $i -lt $files.Count; $i++) {
        $entry = $archive.CreateEntry($files[$i], [System.IO.Compression.CompressionLevel]::Optimal)
        $entry.LastWriteTime = [DateTimeOffset]::new(2026, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
        $inputStream = [System.IO.File]::OpenRead($items[$i])
        $outputStream = $entry.Open()
        try { $inputStream.CopyTo($outputStream) }
        finally { $inputStream.Dispose(); $outputStream.Dispose() }
    }
} finally { $archive.Dispose(); $stream.Dispose() }

# Verify every archived byte against the allowed source files before publishing.
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    if ($archive.Entries.Count -ne $files.Count) { throw 'Unexpected archive entries.' }
    foreach ($entry in $archive.Entries) {
        if ($entry.FullName -notin $files) { throw "Unexpected archive path: $($entry.FullName)" }
        $entryStream = $entry.Open()
        $sha = [System.Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($sha.ComputeHash($entryStream)).Replace('-', '').ToLowerInvariant() }
        finally { $sha.Dispose(); $entryStream.Dispose() }
        $expected = (Get-FileHash -LiteralPath (Join-Path $projectDir $entry.FullName) -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $expected) { throw "Archive content mismatch: $($entry.FullName)" }
    }
} finally { $archive.Dispose() }
Copy-Item -LiteralPath (Join-Path $projectDir 'report-studio.html') -Destination (Join-Path $releaseDir 'report-studio.html') -Force
$checksums = foreach ($name in @("report-studio-v$version.zip", 'report-studio.html')) {
    $hash = (Get-FileHash -LiteralPath (Join-Path $releaseDir $name) -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $name"
}
[System.IO.File]::WriteAllText((Join-Path $releaseDir 'SHA256SUMS.txt'), ($checksums -join "`n") + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output "Verified release package: $archivePath ($($files.Count) files)"
