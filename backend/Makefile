
.PHONY: build-ApplicationsFunction build-ResumeFunction

build-ApplicationsFunction:
	npm ci
	npm run build
	powershell -NoProfile -Command "Copy-Item -Path dist,package.json,package-lock.json -Destination '$(ARTIFACTS_DIR)' -Recurse -Force"
	cd $(ARTIFACTS_DIR) && npm ci --omit=dev

build-ResumeFunction:
	npm ci
	npm run build
	powershell -NoProfile -Command "Copy-Item -Path dist,package.json,package-lock.json -Destination '$(ARTIFACTS_DIR)' -Recurse -Force"
	cd $(ARTIFACTS_DIR) && npm ci --omit=dev
