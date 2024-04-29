import http from "k6/http";
import { Trend, Rate, Counter, Gauge } from "k6/metrics";
import { sleep } from "k6";

export const TrendRTT = new Trend("RTT");
export const RateContentOK = new Rate("ContentOK");
export const GaugeContentSize = new Gauge("ContentSize");
export const CounterErrors = new Counter("Errors");
export const options = {
  thresholds: {
    Errors: ["count<100"],
    ContentSize: ["value<4000"],
    ContentOK: ["rate>0.95"],
    RTT: ["p(99)<300", "p(70)<250", "avg<200", "med<150", "min<100"],
  },
};

export default function () {
  const res = http.get("https://test-api.k6.io/public/crocodiles/1/");
  const contentOK = res.json("name") === "Belt";

  TrendRTT.add(res.timings.duration);
  RateContentOK.add(contentOK);
  GaugeContentSize.add(res.body.length);
  CounterErrors.add(!contentOK);

  sleep(1);
}
