$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

$Script:RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script:OutputDir = Join-Path $Script:RootDir "transcriptions"
$Script:ToolsDir = Join-Path $Script:RootDir "outils"
$Script:LocalFfmpegDir = Join-Path $Script:ToolsDir "ffmpeg"
$Script:LocalFfmpegExe = Join-Path $Script:LocalFfmpegDir "ffmpeg.exe"
$Script:FfmpegDownloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$Script:ResultText = ""

function New-Label {
  param([string]$Text, [int]$X, [int]$Y, [int]$Width = 180, [int]$Height = 22)

  $label = New-Object System.Windows.Forms.Label
  $label.Text = $Text
  $label.Location = New-Object System.Drawing.Point($X, $Y)
  $label.Size = New-Object System.Drawing.Size($Width, $Height)
  $label.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
  return $label
}

function Format-Bytes {
  param([long]$Bytes)

  if ($Bytes -ge 1GB) {
    return "{0:N2} GB" -f ($Bytes / 1GB)
  }
  if ($Bytes -ge 1MB) {
    return "{0:N1} MB" -f ($Bytes / 1MB)
  }
  return "{0:N1} KB" -f ($Bytes / 1KB)
}

function Get-MimeType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".mp3" { return "audio/mpeg" }
    ".mp4" { return "audio/mp4" }
    ".mpeg" { return "audio/mpeg" }
    ".mpga" { return "audio/mpeg" }
    ".m4a" { return "audio/mp4" }
    ".wav" { return "audio/wav" }
    ".webm" { return "audio/webm" }
    ".ogg" { return "audio/ogg" }
    ".flac" { return "audio/flac" }
    default { return "application/octet-stream" }
  }
}

function Find-Ffmpeg {
  if (Test-Path -LiteralPath $Script:LocalFfmpegExe) {
    return $Script:LocalFfmpegExe
  }

  if ($env:FFMPEG_PATH -and (Test-Path -LiteralPath $env:FFMPEG_PATH)) {
    return $env:FFMPEG_PATH
  }

  $command = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $command = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  return ""
}

function Assert-Curl {
  $command = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "curl.exe est introuvable. Windows 10/11 l'inclut normalement."
  }
}

function Invoke-TranscriptionRequest {
  param(
    [string]$FilePath,
    [string]$ApiKey,
    [string]$Model,
    [string]$Language,
    [string]$Prompt,
    [string]$MimeType
  )

  $curlArgs = @(
    "-sS",
    "https://api.openai.com/v1/audio/transcriptions",
    "-H",
    "Authorization: Bearer $ApiKey",
    "-F",
    "model=$Model",
    "-F",
    "response_format=text"
  )

  if ($Language -and $Language -ne "auto") {
    $curlArgs += @("-F", "language=$Language")
  }

  if ($Prompt.Trim().Length -gt 0) {
    $curlArgs += @("-F", "prompt=$Prompt")
  }

  $curlArgs += @("-F", "file=@$FilePath;type=$MimeType")

  $rawOutput = & curl.exe @curlArgs 2>&1
  $exitCode = $LASTEXITCODE
  $output = ($rawOutput | Out-String).Trim()

  if ($exitCode -ne 0) {
    throw "Erreur curl ($exitCode): $output"
  }

  $trimmedOutput = $output.TrimStart()
  if ($trimmedOutput.StartsWith("{")) {
    $json = $output | ConvertFrom-Json -ErrorAction Stop
    if ($json.error) {
      throw $json.error.message
    }
  }

  return $output
}

function Split-Audio {
  param(
    [string]$FfmpegPath,
    [string]$InputPath,
    [string]$OutputPattern,
    [int]$SegmentSeconds
  )

  $ffmpegArgs = @(
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    $InputPath,
    "-map",
    "0:a:0",
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "48k",
    "-f",
    "segment",
    "-segment_time",
    "$SegmentSeconds",
    "-reset_timestamps",
    "1",
    $OutputPattern
  )

  $rawOutput = & $FfmpegPath @ffmpegArgs 2>&1
  $exitCode = $LASTEXITCODE
  $output = ($rawOutput | Out-String).Trim()

  if ($exitCode -ne 0) {
    throw "ffmpeg a echoue ($exitCode): $output"
  }
}

function Install-LocalFfmpeg {
  param([scriptblock]$Log)

  Assert-Curl
  New-Item -ItemType Directory -Force -Path $Script:ToolsDir | Out-Null
  New-Item -ItemType Directory -Force -Path $Script:LocalFfmpegDir | Out-Null

  $zipPath = Join-Path $Script:ToolsDir "ffmpeg-release-essentials.zip"
  $extractDir = Join-Path $Script:ToolsDir "ffmpeg-extract"

  if (Test-Path -LiteralPath $extractDir) {
    Remove-Item -LiteralPath $extractDir -Recurse -Force
  }

  & $Log "Telechargement de ffmpeg..."
  & curl.exe -L $Script:FfmpegDownloadUrl -o $zipPath
  if ($LASTEXITCODE -ne 0) {
    throw "Le telechargement de ffmpeg a echoue."
  }

  & $Log "Extraction de ffmpeg..."
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

  $binFiles = Get-ChildItem -LiteralPath $extractDir -Recurse -File |
    Where-Object { $_.DirectoryName -like "*\bin" -and $_.Name -match "\.exe$" }

  if (-not $binFiles) {
    throw "ffmpeg.exe est introuvable dans l'archive telechargee."
  }

  foreach ($file in $binFiles) {
    Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $Script:LocalFfmpegDir $file.Name) -Force
  }

  Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue

  if (-not (Test-Path -LiteralPath $Script:LocalFfmpegExe)) {
    throw "L'installation locale de ffmpeg n'a pas produit ffmpeg.exe."
  }

  & $Log "ffmpeg est installe localement."
  return $Script:LocalFfmpegExe
}

function Save-Transcript {
  param([string]$AudioPath, [string]$Text)

  New-Item -ItemType Directory -Force -Path $Script:OutputDir | Out-Null
  $safeName = [System.IO.Path]::GetFileNameWithoutExtension($AudioPath)
  $safeName = ($safeName -replace "[^\w\-. ]", "_").Trim()
  if (-not $safeName) {
    $safeName = "audio"
  }
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $outputPath = Join-Path $Script:OutputDir "$safeName-transcription-$timestamp.txt"
  Set-Content -LiteralPath $outputPath -Value $Text -Encoding UTF8
  return $outputPath
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Transcription audio locale"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(1040, 760)
$form.MinimumSize = New-Object System.Drawing.Size(920, 680)
$form.BackColor = [System.Drawing.Color]::FromArgb(245, 247, 250)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

$title = New-Object System.Windows.Forms.Label
$title.Text = "Transcription audio locale"
$title.Location = New-Object System.Drawing.Point(18, 14)
$title.Size = New-Object System.Drawing.Size(450, 34)
$title.Font = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(23, 32, 51)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Pour audio long: decoupage automatique avec ffmpeg, puis transcription OpenAI."
$subtitle.Location = New-Object System.Drawing.Point(20, 50)
$subtitle.Size = New-Object System.Drawing.Size(720, 22)
$subtitle.ForeColor = [System.Drawing.Color]::FromArgb(93, 107, 120)
$form.Controls.Add($subtitle)

$form.Controls.Add((New-Label "Cle API OpenAI" 22 92))
$apiKeyBox = New-Object System.Windows.Forms.TextBox
$apiKeyBox.Location = New-Object System.Drawing.Point(180, 88)
$apiKeyBox.Size = New-Object System.Drawing.Size(560, 28)
$apiKeyBox.UseSystemPasswordChar = $true
$apiKeyBox.Text = $env:OPENAI_API_KEY
$form.Controls.Add($apiKeyBox)

$form.Controls.Add((New-Label "Modele" 760 92 80))
$modelBox = New-Object System.Windows.Forms.TextBox
$modelBox.Location = New-Object System.Drawing.Point(820, 88)
$modelBox.Size = New-Object System.Drawing.Size(180, 28)
$modelBox.Text = if ($env:OPENAI_TRANSCRIPTION_MODEL) { $env:OPENAI_TRANSCRIPTION_MODEL } else { "gpt-4o-transcribe" }
$form.Controls.Add($modelBox)

$form.Controls.Add((New-Label "Fichier audio" 22 132))
$fileBox = New-Object System.Windows.Forms.TextBox
$fileBox.Location = New-Object System.Drawing.Point(180, 128)
$fileBox.Size = New-Object System.Drawing.Size(660, 28)
$form.Controls.Add($fileBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = "Selectionner"
$browseButton.Location = New-Object System.Drawing.Point(852, 126)
$browseButton.Size = New-Object System.Drawing.Size(148, 32)
$form.Controls.Add($browseButton)

$form.Controls.Add((New-Label "Langue" 22 172))
$languageBox = New-Object System.Windows.Forms.ComboBox
$languageBox.Location = New-Object System.Drawing.Point(180, 168)
$languageBox.Size = New-Object System.Drawing.Size(150, 28)
$languageBox.DropDownStyle = "DropDownList"
[void]$languageBox.Items.Add("fr")
[void]$languageBox.Items.Add("auto")
[void]$languageBox.Items.Add("en")
$languageBox.SelectedItem = "fr"
$form.Controls.Add($languageBox)

$form.Controls.Add((New-Label "Segments (min)" 360 172 130))
$segmentBox = New-Object System.Windows.Forms.ComboBox
$segmentBox.Location = New-Object System.Drawing.Point(492, 168)
$segmentBox.Size = New-Object System.Drawing.Size(90, 28)
$segmentBox.DropDownStyle = "DropDownList"
[void]$segmentBox.Items.Add("5")
[void]$segmentBox.Items.Add("10")
[void]$segmentBox.Items.Add("15")
$segmentBox.SelectedItem = "10"
$form.Controls.Add($segmentBox)

$ffmpegStatus = New-Object System.Windows.Forms.Label
$ffmpegStatus.Location = New-Object System.Drawing.Point(608, 172)
$ffmpegStatus.Size = New-Object System.Drawing.Size(240, 22)
$ffmpegStatus.ForeColor = [System.Drawing.Color]::FromArgb(93, 107, 120)
$form.Controls.Add($ffmpegStatus)

$installFfmpegButton = New-Object System.Windows.Forms.Button
$installFfmpegButton.Text = "Installer ffmpeg local"
$installFfmpegButton.Location = New-Object System.Drawing.Point(852, 166)
$installFfmpegButton.Size = New-Object System.Drawing.Size(148, 32)
$form.Controls.Add($installFfmpegButton)

$form.Controls.Add((New-Label "Contexte" 22 214))
$promptBox = New-Object System.Windows.Forms.TextBox
$promptBox.Location = New-Object System.Drawing.Point(180, 210)
$promptBox.Size = New-Object System.Drawing.Size(820, 64)
$promptBox.Multiline = $true
$promptBox.ScrollBars = "Vertical"
$promptBox.Text = ""
$form.Controls.Add($promptBox)

$transcribeButton = New-Object System.Windows.Forms.Button
$transcribeButton.Text = "Lancer la transcription"
$transcribeButton.Location = New-Object System.Drawing.Point(22, 292)
$transcribeButton.Size = New-Object System.Drawing.Size(210, 38)
$transcribeButton.BackColor = [System.Drawing.Color]::FromArgb(27, 108, 168)
$transcribeButton.ForeColor = [System.Drawing.Color]::White
$transcribeButton.FlatStyle = "Flat"
$form.Controls.Add($transcribeButton)

$copyButton = New-Object System.Windows.Forms.Button
$copyButton.Text = "Copier"
$copyButton.Location = New-Object System.Drawing.Point(246, 292)
$copyButton.Size = New-Object System.Drawing.Size(110, 38)
$copyButton.Enabled = $false
$form.Controls.Add($copyButton)

$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = "Enregistrer TXT"
$saveButton.Location = New-Object System.Drawing.Point(368, 292)
$saveButton.Size = New-Object System.Drawing.Size(150, 38)
$saveButton.Enabled = $false
$form.Controls.Add($saveButton)

$progress = New-Object System.Windows.Forms.ProgressBar
$progress.Location = New-Object System.Drawing.Point(538, 300)
$progress.Size = New-Object System.Drawing.Size(462, 22)
$progress.Minimum = 0
$progress.Maximum = 100
$form.Controls.Add($progress)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Pret."
$statusLabel.Location = New-Object System.Drawing.Point(22, 342)
$statusLabel.Size = New-Object System.Drawing.Size(978, 22)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(93, 107, 120)
$form.Controls.Add($statusLabel)

$resultBox = New-Object System.Windows.Forms.TextBox
$resultBox.Location = New-Object System.Drawing.Point(22, 372)
$resultBox.Size = New-Object System.Drawing.Size(978, 260)
$resultBox.Multiline = $true
$resultBox.ScrollBars = "Both"
$resultBox.WordWrap = $true
$resultBox.Font = New-Object System.Drawing.Font("Consolas", 10)
$form.Controls.Add($resultBox)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(22, 642)
$logBox.Size = New-Object System.Drawing.Size(978, 58)
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::White
$form.Controls.Add($logBox)

function Append-Log {
  param([string]$Message)

  $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $Message
  $logBox.AppendText("$line`r`n")
  $statusLabel.Text = $Message
  [System.Windows.Forms.Application]::DoEvents()
}

function Refresh-FfmpegStatus {
  $ffmpeg = Find-Ffmpeg
  if ($ffmpeg) {
    $ffmpegStatus.Text = "ffmpeg: OK"
    $ffmpegStatus.ForeColor = [System.Drawing.Color]::FromArgb(46, 139, 87)
  } else {
    $ffmpegStatus.Text = "ffmpeg: manquant"
    $ffmpegStatus.ForeColor = [System.Drawing.Color]::FromArgb(192, 57, 43)
  }
}

$browseButton.Add_Click({
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = "Choisir un fichier audio"
  $dialog.Filter = "Audio|*.mp3;*.mp4;*.mpeg;*.mpga;*.m4a;*.wav;*.webm;*.ogg;*.flac|Tous les fichiers|*.*"
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $fileBox.Text = $dialog.FileName
  }
})

$installFfmpegButton.Add_Click({
  $installFfmpegButton.Enabled = $false
  try {
    Install-LocalFfmpeg -Log ${function:Append-Log} | Out-Null
    Refresh-FfmpegStatus
    [System.Windows.Forms.MessageBox]::Show("ffmpeg est installe dans le dossier outils.", "Installation terminee") | Out-Null
  } catch {
    Append-Log $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Erreur ffmpeg") | Out-Null
  } finally {
    $installFfmpegButton.Enabled = $true
  }
})

$copyButton.Add_Click({
  if ($Script:ResultText) {
    [System.Windows.Forms.Clipboard]::SetText($Script:ResultText)
    Append-Log "Transcription copiee dans le presse-papiers."
  }
})

$saveButton.Add_Click({
  if ($Script:ResultText) {
    try {
      $path = Save-Transcript -AudioPath $fileBox.Text -Text $Script:ResultText
      Append-Log "Fichier enregistre: $path"
      [System.Windows.Forms.MessageBox]::Show("Transcription enregistree:`n$path", "Fichier cree") | Out-Null
    } catch {
      Append-Log $_.Exception.Message
    }
  }
})

$transcribeButton.Add_Click({
  $tempDir = $null
  $transcribeButton.Enabled = $false
  $copyButton.Enabled = $false
  $saveButton.Enabled = $false
  $Script:ResultText = ""
  $resultBox.Text = ""
  $progress.Value = 0

  try {
    Assert-Curl

    $apiKey = $apiKeyBox.Text.Trim()
    $audioPath = $fileBox.Text.Trim()
    $model = $modelBox.Text.Trim()
    $language = [string]$languageBox.SelectedItem
    $prompt = $promptBox.Text
    $segmentSeconds = [int]$segmentBox.SelectedItem * 60

    if (-not $apiKey) {
      throw "Ajoutez votre cle API OpenAI."
    }
    if (-not $model) {
      throw "Ajoutez un modele de transcription."
    }
    if (-not (Test-Path -LiteralPath $audioPath)) {
      throw "Selectionnez un fichier audio valide."
    }

    $fileInfo = Get-Item -LiteralPath $audioPath
    Append-Log "Fichier: $($fileInfo.Name) - $(Format-Bytes $fileInfo.Length)"

    $segments = @()
    if ($fileInfo.Length -gt 24MB) {
      $ffmpeg = Find-Ffmpeg
      if (-not $ffmpeg) {
        throw "Votre audio depasse 25 MB. Cliquez sur 'Installer ffmpeg local', puis relancez la transcription."
      }

      $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("transcription-audio-" + [System.Guid]::NewGuid().ToString("N"))
      New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
      $pattern = Join-Path $tempDir "segment-%03d.mp3"
      Append-Log "Decoupage audio en segments..."
      $progress.Style = "Marquee"
      Split-Audio -FfmpegPath $ffmpeg -InputPath $audioPath -OutputPattern $pattern -SegmentSeconds $segmentSeconds
      $progress.Style = "Blocks"
      $segments = @(Get-ChildItem -LiteralPath $tempDir -Filter "segment-*.mp3" | Sort-Object Name)
      if ($segments.Count -eq 0) {
        throw "Aucun segment n'a ete cree."
      }
    } else {
      $segments = @($fileInfo)
    }

    $progress.Maximum = [Math]::Max($segments.Count, 1)
    $progress.Value = 0
    $texts = New-Object System.Collections.Generic.List[string]

    for ($index = 0; $index -lt $segments.Count; $index++) {
      $segment = $segments[$index]
      Append-Log ("Transcription segment {0}/{1}: {2}" -f ($index + 1), $segments.Count, $segment.Name)

      $mimeType = if ($fileInfo.Length -gt 24MB) { "audio/mpeg" } else { Get-MimeType $segment.FullName }
      $text = Invoke-TranscriptionRequest `
        -FilePath $segment.FullName `
        -ApiKey $apiKey `
        -Model $model `
        -Language $language `
        -Prompt $prompt `
        -MimeType $mimeType

      if ($text.Trim()) {
        $texts.Add($text.Trim()) | Out-Null
      }

      $progress.Value = [Math]::Min($index + 1, $progress.Maximum)
      $resultBox.Text = ($texts -join "`r`n`r`n")
      [System.Windows.Forms.Application]::DoEvents()
    }

    $Script:ResultText = ($texts -join "`r`n`r`n")
    if (-not $Script:ResultText.Trim()) {
      throw "La transcription est vide."
    }

    $outputPath = Save-Transcript -AudioPath $audioPath -Text $Script:ResultText
    $copyButton.Enabled = $true
    $saveButton.Enabled = $true
    Append-Log "Termine. Fichier cree: $outputPath"
    [System.Windows.Forms.MessageBox]::Show("Transcription terminee.`n$outputPath", "Termine") | Out-Null
  } catch {
    $progress.Style = "Blocks"
    Append-Log $_.Exception.Message
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Erreur") | Out-Null
  } finally {
    if ($tempDir -and (Test-Path -LiteralPath $tempDir)) {
      Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    $progress.Style = "Blocks"
    $transcribeButton.Enabled = $true
  }
})

Refresh-FfmpegStatus
[void]$form.ShowDialog()
