$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$adDir = Join-Path $root 'public\ads\premium-commercial'
$voiceDir = Join-Path $adDir 'voice'
New-Item -ItemType Directory -Force -Path $voiceDir | Out-Null

Add-Type -AssemblyName System.Speech

$lines = @(
  @{ at = 0.30; rate = 1; text = "What if this wasn't just a puzzle?" },
  @{ at = 3.25; rate = 1; text = "Years later, collectors started looking." },
  @{ at = 6.20; rate = 1; text = "Rare and discontinued puzzles can become collectibles." },
  @{ at = 10.25; rate = 1; text = "Some puzzles become part of a collector's story." },
  @{ at = 15.25; rate = 1; text = "Find them on Puzzle Market." },
  @{ at = 17.75; rate = 2; text = "Discover tomorrow's collectibles." }
)

$preferredVoices = @(
  'Microsoft David Desktop',
  'Microsoft Zira Desktop'
)

$voiceFiles = @()
$i = 0
foreach ($line in $lines) {
  $i++
  $file = Join-Path $voiceDir ("voice-{0:D2}.wav" -f $i)
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $installedVoices = $synth.GetInstalledVoices()
  $voice = $null
  foreach ($preferredVoice in $preferredVoices) {
    $voice = $installedVoices | Where-Object { $_.VoiceInfo.Name -eq $preferredVoice } | Select-Object -First 1
    if ($voice) { break }
  }
  if (-not $voice) {
    $voice = $installedVoices | Where-Object { $_.VoiceInfo.Culture.Name -eq 'en-US' } | Select-Object -First 1
  }
  if ($voice) {
    try {
      $synth.SelectVoice($voice.VoiceInfo.Name)
    } catch {
      Write-Warning "Could not select $($voice.VoiceInfo.Name); using default Windows voice."
    }
  }
  $synth.Rate = [int]$line.rate
  $synth.Volume = 100
  $synth.SetOutputToWaveFile($file)
  $synth.Speak($line.text)
  $synth.Dispose()
  $voiceFiles += @{ file = $file; delay = [int]([double]$line.at * 1000) }
}

$ffmpeg = node -e "console.log(require('ffmpeg-static'))"

function Add-VoiceToVideo($inputName, $outputName) {
  $inputPath = Join-Path $adDir $inputName
  $outputPath = Join-Path $adDir $outputName

  $args = @('-y', '-i', $inputPath)
  foreach ($vf in $voiceFiles) {
    $args += @('-i', $vf.file)
  }

  $filterParts = @('[0:a]volume=0.22[music]')
  for ($n = 0; $n -lt $voiceFiles.Count; $n++) {
    $inputIndex = $n + 1
    $delay = $voiceFiles[$n].delay
    $filterParts += ("[{0}:a]volume=1.75,adelay={1}|{1}[v{2}]" -f $inputIndex, $delay, $n)
  }
  $mixInputs = '[music]' + (($voiceFiles.Count | ForEach-Object { }) -join '')
  $voiceLabels = ''
  for ($n = 0; $n -lt $voiceFiles.Count; $n++) {
    $voiceLabels += "[v$n]"
  }
  $filterParts += ("[music]{0}amix=inputs={1}:duration=first:dropout_transition=0,volume=1.0[aout]" -f $voiceLabels, ($voiceFiles.Count + 1))
  $filter = $filterParts -join ';'

  $args += @(
    '-filter_complex', $filter,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-shortest',
    $outputPath
  )

  & $ffmpeg @args
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed for $inputName"
  }
  return $outputPath
}

$made = @()
$made += Add-VoiceToVideo 'puzzle-market-premium-collectibles-20s-1080x1920.mp4' 'puzzle-market-premium-collectibles-20s-1080x1920-voice.mp4'
$made += Add-VoiceToVideo 'puzzle-market-premium-collectibles-20s-4k-upscaled.mp4' 'puzzle-market-premium-collectibles-20s-4k-voice.mp4'

$made | ForEach-Object { Write-Output $_ }
