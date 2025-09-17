---
layout: post
---

# Architecture of a real Edge AI sensor code

In the last post we explored the relevance of something silly as ring buffers for capturing the frames and data captured from a camera for understanding the human behavior that occured before and after an event of interest occurs. That's fine and relevant, now we will see how to incorporate that functionality into a real sensor that is already deployed. For the moment we want to record every time a person is present in the scene.

Let's not get lost in theory. This is about running on a real device with flaky power, tight memory, and a network that disappears whenever it feels like taking a break. Below is how I think about the system: a set of small, opinionated processors talking over a message bus. You get true parallelism, isolation, and the ability to rewire the graph without recompiling the world.

## The system as a graph

Think nodes and edges. Nodes are tiny processes: camera readers, detectors, ring-buffers, exporters. Edges are channels with names like `frames:raw` or `triggers:person`, they tell you what flows where.

![Flowchart](/assets/images/post4/flowchart_arch.png)

This gives you modularity (swap detectors), extensibility (add processors), and reasonable fault isolation (one process crashes, the rest keep chugging). The trick is to keep each processor small and the contracts obvious.

## Patterns you actually use

There are a few patterns that come up over and over. Learn them and you'll stop inventing new ones every week.

- Linear pipelines: Camera → Detector → Trigger → Recorder
- Fan-out: publish frames once, many consumers subscribe
- Event-driven: detectors publish triggers, buffers react and save
- Feedback loops: exporters report back success/fail and local state adapts

Each pattern has practical trade-offs, buffering, backpressure, and how much you want to tolerate dropped frames vs stale state.

Those four patterns solve most problems. Stop inventing new ones.

## Keep processors dumb and config-driven

Processors are small state machines. They own a queue, some state, and one responsibility. Make them configurable so the same code fits many deployments.

Example config knobs I reach for:

- detection confidence threshold
- number of AI cores to use
- buffer length in seconds
- trigger cooldown

With a YAML file you rewire behavior without shipping new binaries. It’s boring but extremely useful.
 

## Process design dumb and config-driven

One responsibility per process. Small state. A queue. A YAML file to tune behavior.

Useful knobs:

- detection confidence
- NPU cores to use
- buffer seconds
- trigger cooldown

Make defaults sane. Expose the rest in config.

Example `config.yaml`:

```yaml
person_detector:
    enabled: true
    confidence_threshold: 0.45
    num_cores: 2
    process_every_n: 1
    trigger_cooldown_seconds: 8

ring_buffer:
    enabled: true
    buffer_seconds: 10
    fps: 15

exporter:
    enabled: true
    upload_endpoint: "https://example.com/api/upload"
    max_retries: 5
    backoff_base_seconds: 2
```

## Message bus the glue

Pick a bus that survives restarts and is language-agnostic. ZeroMQ is cheap and easy. Use clear channel names: `type:subtype:detail`.

For `frames:` channels: conflate, set RCVHWM, avoid blocking reads unless you want the whole pipeline to stall.

Here are two tiny Python mockups you can copy into your project: a minimal ZeroMQ publisher/subscriber helper and a `BaseProcessor` process that all processors can inherit from.

```python
# zmq_bus.py tiny helper for publish/subscribe
import zmq
import pickle

class ZmqBus:
    def __init__(self, pub_port=5555, sub_port=5556, start_proxy=False):
        ctx = zmq.Context.instance()
        self.pub = ctx.socket(zmq.PUB)
        self.pub.bind(f"tcp://0.0.0.0:{pub_port}")

        self.sub = ctx.socket(zmq.SUB)
        self.sub.connect(f"tcp://127.0.0.1:{sub_port}")

    def publish(self, channel: str, obj):
        self.pub.send_multipart([channel.encode(), pickle.dumps(obj)])

    def subscribe(self, channel: str):
        self.sub.setsockopt(zmq.SUBSCRIBE, channel.encode())

    def recv(self, timeout_ms=1000):
        if self.sub.poll(timeout_ms):
            topic, payload = self.sub.recv_multipart()
            return topic.decode(), pickle.loads(payload)
        return None, None
```

```python
# base_processor.py minimal process base class using multiprocessing
import multiprocessing as mp
import time

class BaseProcessor(mp.Process):
    def __init__(self, name: str, bus: 'ZmqBus', config: dict = None):
        super().__init__(name=name)
        self.name = name
        self.bus = bus
        self.config = config or {}
        self.running = mp.Event()

    def setup(self):
        # override: subscribe to channels, init hw, load model
        pass

    def process(self):
        # override: main loop body
        time.sleep(0.01)

    def cleanup(self):
        # override: free resources
        pass

    def run(self):
        try:
            self.setup()
            self.running.set()
            while self.running.is_set():
                self.process()
        finally:
            self.cleanup()
```

## Trigger flow concrete

1. Camera publishes `frames:raw` with metadata (frame_id, fps, thermal).
2. Detector samples (maybe every Nth), publishes `triggers:person` with confidence + thumbnail.
3. Ring buffer, holding pre-frames, saves pre+post into a video chunk.
4. Exporter queues uploads and retries with backoff when the network is trash.

Don't make detectors wait for uploads or disk I/O. Let the exporter handle that mess.

Here is an example clip recorded from the ring buffer:

<video controls width="720">
    <source src="/assets/images/post4/vid_example.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

*Example: ten-second clip captured by the ring buffer when a person was detected.*

## What I tune in the wild

- Frame pacing: sleep a little if ahead. Don't busy-loop.
- NPU: load per-core model instances and shard work.
- Memory: pre-allocate ring buffer (fps × seconds) with deque(maxlen).
- Bus: RCVHWM, CONFLATE for real-time channels.

## TL;DR

Practical, not pretty. Small focused processes. A dumb, fast bus. Config-first. Ring buffer for the ten seconds you actually care about.
