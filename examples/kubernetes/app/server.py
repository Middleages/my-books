"""Teaching HTTP app; no DB, credentials, or third-party Python packages."""
import os
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

def response(path, version, message, unready, fail_live):
    path = path.split('?', 1)[0]
    if path == '/health/live':
        return (500 if fail_live else 200), 'text/plain', b'live failed\n' if fail_live else b'live\n'
    if path == '/health/ready':
        return (503 if unready else 200), 'text/plain', b'not ready\n' if unready else b'ready\n'
    if path == '/':
        body = f'<!doctype html><html lang="en"><meta charset="utf-8"><title>study-web</title><h1>study-web {escape(version)}</h1><p>{escape(message)}</p></html>'
        return 200, 'text/html; charset=utf-8', body.encode()
    return 404, 'text/plain', b'not found\n'

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status, mime, body = response(self.path, os.getenv('APP_VERSION', 'v1'),
            os.getenv('APP_MESSAGE', 'hello books-lab'), os.getenv('APP_UNREADY') == '1',
            os.getenv('APP_FAIL_LIVE') == '1')
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', int(os.getenv('PORT', '8080'))), Handler).serve_forever()
