package main

import (
	"net"
	"net/http"
	"strings"

	"github.com/mileusna/useragent"
)

func getDeviceName(ua string) string {
	parsedUA := useragent.Parse(ua)
	os := parsedUA.OS
	return os
}

func getIP(r *http.Request) string {
	var ip string

	// 1. Cloudflare's CF-Connecting-IP (most trusted when present)
	if cfIP := r.Header.Get("CF-Connecting-IP"); cfIP != "" {
		ip = strings.TrimSpace(strings.Split(cfIP, ",")[0])
	} else if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		// 2. X-Forwarded-For: take first entry
		ip = strings.TrimSpace(strings.Split(fwd, ",")[0])
	} else if r.RemoteAddr != "" {
		// 3. Fallback to RemoteAddr
		var err error
		ip, _, err = net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr // fallback if no port
		}
	}

	if ip == "" {
		return "127.0.0.1" // safety fallback
	}

	// Strip ::ffff: prefix (IPv4-mapped IPv6)
	if after, ok := strings.CutPrefix(ip, "::ffff:"); ok {
		ip = after
	}

	// Normalize loopback and treat all private IPs as localhost
	if ip == "::1" || ip == "127.0.0.1" || isPrivateIP(ip) {
		return "127.0.0.1"
	}

	return ip
}

func isPrivateIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}

	// IPv4 private ranges
	if ip.To4() != nil {
		privateRanges := []string{
			"10.0.0.0/8",
			"172.16.0.0/12",
			"192.168.0.0/16",
		}
		for _, cidr := range privateRanges {
			_, net, _ := net.ParseCIDR(cidr)
			if net.Contains(ip) {
				return true
			}
		}
		return false
	}

	// IPv6 private ranges
	// Unique Local Addresses (fc00::/7, but only when second bit is 1 → fd00::/8 is common)
	if ip.IsPrivate() {
		return true
	}

	// Link-local (fe80::/10)
	if ip.IsLinkLocalUnicast() {
		return true
	}

	// Site-local (fec0::/10) - deprecated but still considered private
	if strings.HasPrefix(ipStr, "fec") || strings.HasPrefix(ipStr, "fed") || strings.HasPrefix(ipStr, "fee") || strings.HasPrefix(ipStr, "fef") {
		return true
	}

	// Discard prefix (100::/64)
	if strings.HasPrefix(ipStr, "100:") {
		return true
	}

	return false
}
