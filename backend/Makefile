.PHONY: build-ApplicationsFunction build-ResumeFunction

build-ApplicationsFunction:
	npm.cmd ci
	npm.cmd run build
	powershell -NoProfile -Command "Copy-Item -Path dist,package.json,package-lock.json -Destination '$(ARTIFACTS_DIR)' -Recurse -Force"
	npm.cmd ci --prefix "$(ARTIFACTS_DIR)" --omit=dev
	powershell -NoProfile -Command "if (-not (Test-Path '$(ARTIFACTS_DIR)\node_modules\zod\package.json')) { throw 'zod missing from Lambda artifact' }"

build-ResumeFunction:
	npm.cmd ci
	npm.cmd run build
	powershell -NoProfile -Command "Copy-Item -Path dist,package.json,package-lock.json -Destination '$(ARTIFACTS_DIR)' -Recurse -Force"
	npm.cmd ci --prefix "$(ARTIFACTS_DIR)" --omit=dev
	powershell -NoProfile -Command "if (-not (Test-Path '$(ARTIFACTS_DIR)\node_modules\zod\package.json')) { throw 'zod missing from Lambda artifact' }"	