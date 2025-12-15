package main

import (
	"fmt"
	"net"
	"net/http"

	"github.com/mileusna/useragent"
)

func getDeviceName(ua string) string {
	parsedUA := useragent.Parse(ua)
	os := parsedUA.OS
	return os
}

func getIP(r *http.Request) string {
	// Get the real remote address, often from X-Forwarded-For or RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	fmt.Println("ip", ip)
	if err != nil {
		ip = r.RemoteAddr
	}

	// Normalize localhost/IPv6 loopback addresses
	if ip == "::1" || ip == "::ffff:127.0.0.1" || ip == "127.0.0.1" {
		return "127.0.0.1"
	}

	return ip
}
