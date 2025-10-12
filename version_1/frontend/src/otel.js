// otel.js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

export function registerOTel() {
  const provider = new WebTracerProvider();
  const exporter = new CollectorTraceExporter({
    serviceName: 'the-price-is-bot-frontend',
    url: 'http://localhost:4318/v1/traces', // Update with your OpenTelemetry collector endpoint
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
}
