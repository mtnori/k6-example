package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

var userChannels = make(map[string]chan string)
var mutex sync.Mutex

func main() {
	http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		// userId := r.Header.Get("X-User-ID")
		userId := "test_user"
		userChannel := getUserChannel(userId)

		log.Println("Sleep start")
		time.Sleep(3 * time.Second)
		log.Println("Sleep finish")

		userChannel <- "REST API was called"
		log.Println("Channel push finish")

		fmt.Fprintf(w, "Response from API")
	})

	http.HandleFunc("/sse", func(w http.ResponseWriter, r *http.Request) {
		flusher, _ := w.(http.Flusher)

		// Set CORS headers to allow all origins. You may want to restrict this to specific origins in a production environment.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Type")

		// userId := r.Header.Get("X-User-ID")
		userId := "test_user"
		userChannel := getUserChannel(userId)

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		// 1秒おきにデータを流す
		t := time.NewTicker(1 * time.Second)
		defer t.Stop()

		done := make(chan struct{})

		go func() {
			cnt := 1
			for {
				select {
				case <-r.Context().Done():
					close(done)
					return
				default:
					select {
					case <-t.C:
						log.Println("timer")
						fmt.Fprintf(w, "data: %d\n\n", cnt)
						cnt++
						flusher.Flush()
					case message := <-userChannel:
						log.Println("message")
						fmt.Fprintf(w, "data: %s\n\n", message)
						flusher.Flush()
					}
				}
			}
		}()

		<-done
		log.Println("コネクションが閉じました")
	})

	fmt.Println("Server listening on :8080")
	http.ListenAndServe(":8080", nil)
}

func getUserChannel(userId string) chan string {
	mutex.Lock()
	defer mutex.Unlock()

	if _, ok := userChannels[userId]; !ok {
		log.Println("Create channel")
		userChannels[userId] = make(chan string, 1)
	}

	log.Printf("%s\n", userId)
	log.Printf("%+v\n", userChannels)

	return userChannels[userId]
}
