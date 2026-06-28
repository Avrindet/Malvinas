$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$preferredPort = 8080

$mimes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.svg'  = 'image/svg+xml'
}

function Get-LanIp {
  try {
    return Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
      Select-Object -ExpandProperty IPAddress -First 1
  } catch {
    return $null
  }
}

function Send-HttpResponse($stream, $status, $contentType, $bodyBytes) {
  $statusText = switch ($status) {
    200 { 'OK' }
    404 { 'Not Found' }
    default { 'Error' }
  }
  $header = "HTTP/1.1 $status $statusText`r`n"
  $header += "Content-Type: $contentType`r`n"
  $header += "Content-Length: $($bodyBytes.Length)`r`n"
  $header += "Connection: close`r`n"
  $header += "Cache-Control: no-cache`r`n"
  $header += "`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bodyBytes.Length -gt 0) {
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
  }
}

function Handle-Client($client) {
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { return }

    while ($true) {
      $line = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($line)) { break }
    }

    $parts = $requestLine -split ' '
    $path = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
    if ($path -eq '/') { $path = '/index.html' }
    $path = $path.Split('?')[0]

    $relative = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $filePath = Join-Path $root $relative

    if ((Test-Path $filePath -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
      $ctype = $mimes[$ext]
      if (-not $ctype) { $ctype = 'application/octet-stream' }
      Send-HttpResponse $stream 200 $ctype $bytes
    } else {
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - No encontrado')
      Send-HttpResponse $stream 404 'text/plain; charset=utf-8' $msg
    }
  } catch {
    # Cliente desconectado
  } finally {
    try { $client.Close() } catch {}
  }
}

$listener = $null
$port = $null

for ($p = $preferredPort; $p -le ($preferredPort + 15); $p++) {
  try {
    $tryListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $p)
    $tryListener.Start()
    $listener = $tryListener
    $port = $p
    break
  } catch {
    continue
  }
}

if (-not $listener) {
  Write-Host "ERROR: No hay puertos libres entre $preferredPort y $($preferredPort + 15)" -ForegroundColor Red
  pause
  exit 1
}

if ($port -ne $preferredPort) {
  Write-Host "Puerto $preferredPort ocupado - usando puerto $port" -ForegroundColor Yellow
}

$lanIp = Get-LanIp

Write-Host ""
Write-Host "  Servidor activo" -ForegroundColor Green
Write-Host "  PC:      http://localhost:$port" -ForegroundColor Cyan
if ($lanIp) {
  Write-Host "  Celular: http://${lanIp}:$port  (misma WiFi)" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Deja esta ventana abierta mientras jugas." -ForegroundColor Gray
Write-Host "  Ctrl+C para detener." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    Handle-Client $client
  }
} finally {
  $listener.Stop()
}
