# ------------------------------------------------------------------
#  serve.ps1 — static server for the Mubby Studio site, no Node needed.
#  Run:  powershell -ExecutionPolicy Bypass -File .\serve.ps1
#  Then open http://localhost:5173
# ------------------------------------------------------------------
param([int]$Port = 5173)

$root = Join-Path $PSScriptRoot 'site'
if (-not (Test-Path $root)) { Write-Error "No 'site' folder next to this script."; exit 1 }

$mime = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8'
  '.json'='application/json; charset=utf-8'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'
  '.png'='image/png'; '.webp'='image/webp'; '.svg'='image/svg+xml'; '.ico'='image/x-icon'
  '.woff2'='font/woff2'; '.woff'='font/woff'; '.txt'='text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch { Write-Error "Could not bind port $Port. Try: .\serve.ps1 -Port 5174"; exit 1 }

Write-Host ""
Write-Host "  Mubby Studio - running locally" -ForegroundColor Yellow
Write-Host "  --------------------------------"
Write-Host "  http://localhost:$Port"
Write-Host "  Ctrl+C to stop"
Write-Host ""

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($rel.EndsWith('/')) { $rel += 'index.html' }
    $file = Join-Path $root ($rel.TrimStart('/') -replace '/', '\')

    $full = [System.IO.Path]::GetFullPath($file)
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root))) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }

    if (Test-Path -LiteralPath $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('<h1 style="font:300 2rem Georgia,serif;padding:3rem">404 - no such frame</h1>')
      $ctx.Response.ContentType = 'text/html; charset=utf-8'
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "404  $rel" -ForegroundColor DarkGray
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop(); $listener.Close()
}
