import { get, post, put, del } from '/src/services/http-service';

export async function fakeChartData() {
  // return request('/api/fake_analysis_chart_data');
  return [];
}

export async function messageAnalysis(params, options) {
  return await post('/api/messages/analysis', params, options);
}