import sse from "k6/x/sse";
import http from "k6/http";
import { check } from "k6";

export default function () {
  const url = "http://localhost:8080/sse";

  const params = {
    method: "GET",
    headers: {
      Authorization: "Bearer XXXX",
    },
    tags: { my_k6s_tag: "hello sse" },
  };

  const response = sse.open(url, params, function (client) {
    client.on("open", function open() {
      console.log("connected");

      // 接続完了したら処理を実施する
      const res = http.get("http://localhost:8080/api");
      check(res, {
        "is status 200": (r) => r.status === 200,
      });

      console.log("requested");
    });

    client.on("event", function (event) {
      console.log(
        `event id=${event.id}, name=${event.name}, data=${event.data}`
      );
      if (event.data === "REST API was called") {
        client.close();
      }
    });

    client.on("error", function (e) {
      console.log("An unexpected error occerred: ", e.error());
    });
  });

  check(response, { "status is 200": (r) => r && r.status === 200 });
}
