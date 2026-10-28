# Rasterize the current outlined WenJian glyph; never regenerate the retired branch mark.
node (Join-Path $PSScriptRoot "build-brand-icon.cjs")
if ($LASTEXITCODE -ne 0) { throw "Icon build failed" }
