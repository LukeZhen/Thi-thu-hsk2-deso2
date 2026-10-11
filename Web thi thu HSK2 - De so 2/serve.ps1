# Local static web server (no install needed). Run: powershell -ExecutionPolicy Bypass -File serve.ps1
# Then open http://localhost:8765/
param([int]$Port = 8765)
$root = $PSScriptRoot
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json'; '.jpg' = 'image/jpeg'; '.png' = 'image/png'; '.mp3' = 'audio/mpeg'; '.pdf' = 'application/pdf'; '.ico' = 'image/x-icon' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
"Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"
while ($l.IsListening) {
  $ctx = $l.GetContext(); $req = $ctx.Request; $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $path.StartsWith($root) -or $rel -like 'admin*' -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $res.StatusCode = 404; $res.Close(); continue
    }
    $ext = [IO.Path]::GetExtension($path).ToLower()
    $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $res.Headers['Accept-Ranges'] = 'bytes'
    $res.Headers['Cache-Control'] = 'no-cache'
    $fs = [IO.File]::OpenRead($path); $len = $fs.Length; $start = 0; $end = $len - 1
    $range = $req.Headers['Range']
    if ($range -match 'bytes=(\d*)-(\d*)') {
      if ($matches[1]) { $start = [int64]$matches[1] }
      if ($matches[2]) { $end = [Math]::Min([int64]$matches[2], $len - 1) }
      $res.StatusCode = 206
      $res.Headers['Content-Range'] = "bytes $start-$end/$len"
    }
    $count = $end - $start + 1
    $res.ContentLength64 = $count
    $fs.Seek($start, 'Begin') | Out-Null
    $buf = New-Object byte[] 65536
    while ($count -gt 0) {
      $n = $fs.Read($buf, 0, [Math]::Min($buf.Length, $count)); if ($n -le 0) { break }
      $res.OutputStream.Write($buf, 0, $n); $count -= $n
    }
    $fs.Close()
  } catch { } finally { try { $res.Close() } catch { } }
}
