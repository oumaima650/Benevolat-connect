$backendDir = "c:\Users\PC\IdeaProjects\Benevolat-connect\backend"
$proc = Start-Process -FilePath "$backendDir\mvnw.cmd" -ArgumentList "compile" -WorkingDirectory $backendDir -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\mvn_out.txt" -RedirectStandardError "$env:TEMP\mvn_err.txt"
Write-Host "Exit code: $($proc.ExitCode)"
$output = Get-Content "$env:TEMP\mvn_out.txt" -ErrorAction SilentlyContinue
$errors = Get-Content "$env:TEMP\mvn_err.txt" -ErrorAction SilentlyContinue
$output | Select-String "ERROR|error:|BUILD" | Select-Object -Last 40
if ($errors) { Write-Host "STDERR:"; $errors | Select-Object -Last 20 }
