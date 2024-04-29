import sse from "k6/x/sse";
import http from "k6/http";
import { check } from "k6";
import { Trend } from "k6/metrics";

const myTrend = new Trend("trendTest", true);

export default function () {
  const url = "http://localhost:8080/sse";

  const params = {
    method: "GET",
    headers: {
      Authorization: "Bearer XXXX",
    },
    tags: { my_k6s_tag: "hello sse" },
  };

  let now;

  const response = sse.open(url, params, function (client) {
    client.on("open", function open() {
      console.log("connected");

      // 接続完了したら処理を実施する
      const res = http.get("http://localhost:8080/api");
      check(res, {
        "is status 200": (r) => r.status === 200,
      });

      // 非同期実行の場合、メッセージの到達に時間がかかる想定
      now = Date.now();
      console.log(`request, ${now}`);
    });

    client.on("event", function (event) {
      console.log(
        `event id=${event.id}, name=${event.name}, data=${event.data}`
      );
      if (event.data === "REST API was called") {
        let finishNow = Date.now();
        console.log(`finishedNow, ${finishNow}`);
        // const endTime = Math.floor((finishNow - now) / 1000);
        const endTime = finishNow - now;
        console.log(`finished, ${endTime}`);
        myTrend.add(endTime);
        client.close();
      }
    });

    client.on("error", function (e) {
      console.log("An unexpected error occerred: ", e.error());
    });
  });

  check(response, { "status is 200": (r) => r && r.status === 200 });
}
