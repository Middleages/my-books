import unittest
from server import response
class AppContract(unittest.TestCase):
    def test_root_escapes_non_secret_message(self):
        status, _, body = response('/', 'v1', '<script>', False, False)
        self.assertEqual(status, 200)
        self.assertIn(b'v1', body)
        self.assertIn(b'&lt;script&gt;', body)
        self.assertNotIn(b'<script>', body)
    def test_readiness_does_not_change_liveness(self):
        self.assertEqual(response('/health/ready', 'v1', '', True, False)[0], 503)
        self.assertEqual(response('/health/live', 'v1', '', True, False)[0], 200)
    def test_liveness_failure_and_unknown_path(self):
        self.assertEqual(response('/health/live', 'v1', '', False, True)[0], 500)
        self.assertEqual(response('/missing', 'v1', '', False, False)[0], 404)
    def test_version_labels(self):
        self.assertIn(b'v2', response('/', 'v2', '', False, False)[2])
if __name__ == '__main__': unittest.main()
