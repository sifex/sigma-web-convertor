import { SigmaTarget } from './types';

export const sigmaTargets: Map<string, SigmaTarget> = new Map([
  ['splunk', {
    title: 'Splunk',
    backend: 'pysigma-backend-splunk',
    backendUrl: 'https://files.pythonhosted.org/packages/40/01/217201109a076c65016162263fbe1701c89906b574ba5ade6364c5b87e2e/pysigma_backend_splunk-1.1.0-py3-none-any.whl'
  }],
  ['lucene', {
    title: 'Lucene',
    backend: 'pysigma-backend-elasticsearch',
    backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
  }],
  ['eql', {
    title: 'EQL',
    backend: 'pysigma-backend-elasticsearch',
    backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
  }],
  ['esql', {
    title: 'ES|QL',
    backend: 'pysigma-backend-elasticsearch',
    backendUrl: 'https://files.pythonhosted.org/packages/48/26/e1aeb7c1ea6679ec1a34aa314cda604337232da4ac95cef0d1c5d85e62cb/pysigma_backend_elasticsearch-1.1.1-py3-none-any.whl'
  }]
]);
