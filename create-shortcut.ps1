$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut("$desktop\PromptManager.lnk")
$lnk.TargetPath = "cmd.exe"
$lnk.Arguments = "/c cd /d `"$dir`" & npm start"
$lnk.WorkingDirectory = $dir
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host "Done! Shortcut created on Desktop." -ForegroundColor Green
