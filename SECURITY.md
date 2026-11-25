# Security

## Reporting

Open a private security advisory on this repository, or email zeal4222@gmail.com. Please do not file a public issue for a vulnerability.

## Known limitation

The plugin registers two routes on the DSH web server:

- `GET /dsh-update-checker/status`
- `POST /dsh-update-checker/upgrade`

They sit outside the page's session authentication, the same as every other plugin route. With the default loopback bind that means any local process, and any web page you visit that can reach `127.0.0.1`, can read the version and start an upgrade. The upgrade takes no input from the caller and only ever runs `npm i -g @deepseek-ai/dsh@latest`.

Do not bind the server to an interface with untrusted users. If you need to, remove this plugin or put your own authentication in front of those paths.
