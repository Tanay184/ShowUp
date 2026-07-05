import threading
import time

# Maximum concurrent Gemini API calls allowed
MAX_CONCURRENT = 8

# Track currently running analyses
active_analyses = 0
active_lock = threading.Lock()


def get_queue_status():
    with active_lock:
        running = active_analyses
    return {
        "active": running,
        "max_concurrent": MAX_CONCURRENT,
        "slots_available": max(0, MAX_CONCURRENT - running),
    }


def process_analysis(task_id, analysis_func, *args, **kwargs):
    """
    Submit an analysis task to the queue.
    Polls until a concurrency slot opens, then runs the function.
    Blocks caller until the result is ready (max 120s timeout).
    """
    global active_analyses
    result_container = {"result": None, "error": None}
    event = threading.Event()

    def run_task():
        global active_analyses
        try:
            result_container["result"] = analysis_func(*args, **kwargs)
        except Exception as e:
            result_container["error"] = str(e)
        finally:
            with active_lock:
                active_analyses -= 1
            event.set()

    def queue_worker():
        global active_analyses
        # Spin-wait until a slot opens (max ~60s wait to avoid starving)
        deadline = time.time() + 60
        while True:
            with active_lock:
                if active_analyses < MAX_CONCURRENT:
                    active_analyses += 1
                    break
            if time.time() > deadline:
                result_container["error"] = "Queue full — all 8 analysis slots busy. Try again shortly."
                event.set()
                return
            time.sleep(0.5)

        thread = threading.Thread(target=run_task, daemon=True)
        thread.start()

    worker = threading.Thread(target=queue_worker, daemon=True)
    worker.start()

    # Wait for result (timeout after 120 seconds)
    completed = event.wait(timeout=120)

    if not completed:
        # Timeout — decrement counter defensively
        with active_lock:
            if active_analyses > 0:
                active_analyses -= 1
        raise TimeoutError("Analysis timed out after 120 seconds.")

    if result_container["error"]:
        raise Exception(result_container["error"])

    return result_container["result"]
