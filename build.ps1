yarn build
if ($?) {
    Write-Host "Build succeeded."
} else {
    Write-Host "Build failed."
    exit 1
}
yarn vsce package
if ($?) {
    Write-Host "VSIX package created successfully."
} else {
    Write-Host "VSIX package creation failed."
    exit 1
}
code --install-extension .\mc-datapack-utility-2.3.0.vsix --force
if ($?) {
    Write-Host "Extension installed successfully."
} else {
    Write-Host "Extension installation failed."
    exit 1
}
