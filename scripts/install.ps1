param([string]$HostName='generic',[string]$Target='.')
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
node packages/cli/index.mjs install-skills --host $HostName --target $Target
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
