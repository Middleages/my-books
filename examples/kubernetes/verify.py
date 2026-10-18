"""Static contract check. Requires PyYAML; does not contact a cluster."""
from pathlib import Path
import sys
import yaml
BASE = Path(__file__).parent

def documents(path):
    return [d for d in yaml.safe_load_all(Path(path).read_text()) if d]

def check(docs, image, ingress):
    by_kind = {d['kind']: d for d in docs}
    assert set(by_kind) == ({'ConfigMap','Deployment','Service','Ingress'} if ingress else {'ConfigMap','Deployment','Service'})
    assert all(d['metadata']['namespace'] == 'books-lab' for d in docs)
    dep, svc = by_kind['Deployment'], by_kind['Service']
    pod = dep['spec']['template']
    assert dep['spec']['selector']['matchLabels'] == svc['spec']['selector'] == pod['metadata']['labels']
    container = pod['spec']['containers'][0]
    assert container['image'] == image
    assert container['imagePullPolicy'] == 'Never'
    assert container['ports'][0]['containerPort'] == svc['spec']['ports'][0]['targetPort'] == 8080
    assert svc['spec']['ports'][0]['port'] == 80
    assert container['envFrom'][0]['configMapRef']['name'] == by_kind['ConfigMap']['metadata']['name']
    for probe in ['startupProbe','readinessProbe','livenessProbe']:
        assert container[probe]['httpGet']['port'] == container['ports'][0]['name']
    assert container['readinessProbe']['httpGet']['path'] == '/health/ready'
    assert container['livenessProbe']['httpGet']['path'] == '/health/live'
    assert pod['spec']['securityContext']['runAsNonRoot'] is True
    if ingress:
        route = by_kind['Ingress']['spec']['rules'][0]['http']['paths'][0]['backend']['service']
        assert route['name'] == svc['metadata']['name'] and route['port']['number'] == 80
    return by_kind

if __name__ == '__main__':
    manifest = check(documents(BASE/'manifests/app.yaml') + documents(BASE/'manifests/ingress.yaml'), 'study-web:v1', True)
    assert len(sys.argv) == 3, 'provide v1 and v2 Helm render paths'
    v1 = check(documents(sys.argv[1]), 'study-web:v1', False)
    v2 = check(documents(sys.argv[2]), 'study-web:v2', True)
    assert manifest['Deployment'] == v1['Deployment']
    assert manifest['ConfigMap'] == v1['ConfigMap']
    assert manifest['Service'] == v1['Service']
    assert manifest['Ingress'] == v2['Ingress']
    print('Static contracts: manifest/v1/v2, ports, selectors, probes, config and optional Ingress PASS')
