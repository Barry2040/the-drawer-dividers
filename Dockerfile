# The Drawer Divider Designer as a small web server for your own network (NAS, Raspberry Pi, …).
# three.js and OpenSCAD are bundled, so the 3D preview and "Make STLs" work without internet.
#
#   docker build -t drawer-divider .
#   docker run -d -p 8080:8080 drawer-divider      ->  http://localhost:8080

# Download the libraries and point the page at the local copies. Runs on the build machine's
# own platform, the result is the same for every target platform.
FROM --platform=$BUILDPLATFORM alpine:3.20 AS vendor
ARG CDN=https://cdn.jsdelivr.net/npm
ADD $CDN/openscad-wasm-prebuilt@1.2.0/dist/openscad.js /site/vendor/openscad.js
ADD $CDN/openscad-wasm-prebuilt@1.2.0/COPYING /site/vendor/openscad-COPYING.txt
ADD $CDN/three@0.160.0/build/three.module.js /site/vendor/three.module.js
ADD $CDN/three@0.160.0/examples/jsm/controls/OrbitControls.js /site/vendor/OrbitControls.js
COPY Drawer-Divider-Designer.html /site/index.html
RUN set -e; cd /site; \
    sed -i -e "s#$CDN/openscad-wasm-prebuilt@1.2.0/dist/openscad.js#./vendor/openscad.js#" \
           -e "s#$CDN/three@0.160.0/build/three.module.js#./vendor/three.module.js#" \
           -e "s#$CDN/three@0.160.0/examples/jsm/controls/OrbitControls.js#./vendor/OrbitControls.js#" \
           -e 's#<meta name="dd-standalone" content="1">#&\n<meta name="dd-local-libs" content="1">#' index.html; \
    if grep -n "$CDN" index.html; then echo "CDN link left in index.html"; exit 1; fi; \
    chmod -R a+rX /site

FROM nginxinc/nginx-unprivileged:1.27-alpine
LABEL org.opencontainers.image.title="Drawer Divider Designer" \
      org.opencontainers.image.description="Plan 3D-printed drawer dividers in the browser and render the STLs" \
      org.opencontainers.image.source="https://github.com/Barry2040/the-drawer-dividers"
COPY --from=vendor /site /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
