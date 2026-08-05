import time
import urllib.request
import concurrent.futures
import sys
import os

def send_request(url):
    start = time.time()
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.status
            latency = (time.time() - start) * 1000.0  # in ms
            return code, latency, None
    except Exception as e:
        return 0, 0.0, str(e)

def run_performance_test(url, user_count=50, duration_seconds=10):
    print(f"[Performance Test] Starting load test on {url} with {user_count} concurrent virtual users for {duration_seconds}s...")
    
    latencies = []
    errors = 0
    total_requests = 0
    
    start_test = time.time()
    
    # We will use ThreadPoolExecutor to simulate concurrent users
    with concurrent.futures.ThreadPoolExecutor(max_workers=user_count) as executor:
        while (time.time() - start_test) < duration_seconds:
            # Launch a batch of requests
            futures = [executor.submit(send_request, url) for _ in range(user_count)]
            for future in concurrent.futures.as_completed(futures):
                code, latency, err = future.result()
                total_requests += 1
                if err or code != 200:
                    errors += 1
                else:
                    latencies.append(latency)
            time.sleep(0.1)  # brief pacing delay between batches
            
    total_time = time.time() - start_test
    rps = total_requests / total_time
    
    metrics = {
        "success": True,
        "rps": round(rps, 2),
        "total_requests": total_requests,
        "errors": errors,
        "error_rate_pct": round((errors / total_requests) * 100, 2) if total_requests > 0 else 0.0,
        "duration_sec": round(total_time, 2)
    }
    
    if latencies:
        latencies.sort()
        metrics.update({
            "avg_ms": round(sum(latencies) / len(latencies), 2),
            "min_ms": round(latencies[0], 2),
            "max_ms": round(latencies[-1], 2),
            "p95_ms": round(latencies[int(len(latencies) * 0.95)], 2),
            "p99_ms": round(latencies[int(len(latencies) * 0.99)], 2)
        })
    else:
        metrics.update({
            "avg_ms": 0.0,
            "min_ms": 0.0,
            "max_ms": 0.0,
            "p95_ms": 0.0,
            "p99_ms": 0.0
        })
        
    return metrics

if __name__ == "__main__":
    url = "http://localhost:4000/api/health"
    res = run_performance_test(url, user_count=20, duration_seconds=5)
    print("RESULTS:", res)
