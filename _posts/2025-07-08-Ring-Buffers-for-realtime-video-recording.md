# Ring Buffers for Realtime Video Recording

When working with real-time computer vision applications, one of the most challenging problems is managing continuous data streams efficiently. Sounds boring, right? Well, it's the difference between a working system and junk.

Imagine you're building a system to detect when an elderly person falls from their bed. You may have a perfectly accurate fall detector, but here's the catch: by the time your algorithm recognizes the fall and triggers the recording, the crucial frames that characterize the fall have already passed by.

This creates a fundamental problem: we need to capture not just the moment of detection, but also the sequence of events leading up to it. Why? Because caregivers need visual context to understand what happened, and researchers need complete event sequences to improve their models. The question becomes: how do you store the "before" when you only know it matters "after"?

## Why Ring Buffers for Video Recording?

The key insight is that video events don't announce themselves beforehand. Ring buffers solve the fundamental problem of capturing pre-event context when you only know it matters post-event. In our elder care scenario, we need both the fall sequence leading up to the detection and the aftermath, a dual-phase recording that captures pre-trigger + post-trigger frames.

This is where video applications differ from typical ring buffer uses. You're not just maintaining a rolling window of recent data but you're maintaining a recording system that can retroactively decide what was important. The critical advantage for video applications is predictable memory usage regardless of how long the system runs - crucial when dealing with frames arriving at 25Hz or higher.

## Decoupling Recording from Detection

Your ring buffer recording should run as a **separate thread or service** from your detection pipeline. Detection and recording have fundamentally different performance requirements.

**Recording Requirements:**
- Must capture every single frame (lossless)
- Needs to run at full sensor frequency (25Hz in our example)
- Simple, fast operations only

**Detection Requirements:**
- Can afford to skip frames
- Computationally intensive deep learning models
- May run at reduced frequency (10Hz) due to processing constraints

## Handling Frame Rate Mismatches

In edge AI scenarios, this separation becomes even more important. Your fall detection model might be so compute-intensive that it can only process every 2nd or 3rd frame:

```
Sensor:    [F1] [F2] [F3] [F4] [F5] [F6] [F7] [F8] [F9] [F10] ...
Recording: [F1] [F2] [F3] [F4] [F5] [F6] [F7] [F8] [F9] [F10] ... (25Hz)
Detection:  [F1]      [F3]      [F5]      [F7]      [F9]      ... (10Hz)
```

**The Problem**: If your detection algorithm running at 10Hz detects a fall at frame F7, the crucial frames F1-F6 might have already been discarded by a naive recording system.

**The Solution**: Your ring buffer, running independently at 25Hz, has preserved all frames. When the detection triggers, you have the complete sequence.

## Edge AI Implementation Considerations

**Memory Constraints**: Edge devices have limited RAM. Calculate your buffer size carefully:
- Frame size: 1920×1080×3 bytes = ~6MB per frame
- 75 frames (3 seconds at 25Hz) = ~450MB

**Processing Separation**: 

```
Process 1: Camera → Ring Buffer (fast, continuous)
Process 2: Camera → Detection Model (slower, can skip frames)
Process 3: Detection Model → Ring Buffer (triggers recording)
```

**Power Management**: The ring buffer thread should be lightweight, just memory copies. Save the heavy lifting (AI inference) for the detection thread that benefit from NPU/GPU processors.

## Why This Architecture Works

When your 10Hz detection algorithm finally recognizes a fall, it doesn't matter that it "missed" frames during processing. The ring buffer thread, running faithfully at 25Hz, captured everything. You get:

- **Complete event context** (despite detection lag)
- **No frame loss** (recording runs independently)
- **Efficient resource usage** (detection can run slower)
- **Scalable performance** (adjust detection frequency based on hardware)

This separation is what makes ring buffers so powerful for real-time applications - they bridge the gap between continuous data streams and intermittent processing capabilities.

## Implementation Challenges & Solutions

Building this architecture in practice involves several critical challenges. Here there are some snippets of my solution that may help you understand how to implement this:

### Inter-Process Communication

```python
# Our camera works as a zeromq pub. We connect to it.
context = zmq.Context()
frame_socket = context.socket(zmq.SUB)
frame_socket.connect(f"tcp://localhost:{zmq_port}")

# Our detector is passed a messaging queue. Old n dirty message enqueing would do the trick for us to create the video.
trigger_queue = multiprocessing.Queue()
```

### Handling Trigger Overlapping

```python
def handle_trigger(self, trigger):
    if trigger == "get_video":
        # Ignore overlapping triggers. Once we detected a fall, there is a chance the elder is still on the ground.
        if self._is_recording:
            self.logger.info("Already recording. New trigger ignored.")
            return
        
        # Start new recording session
        self._is_recording = True
        self._capture_pre_trigger_snapshot()
```

### Automatic Recording Termination

```python
def check_recording_complete(self):
    # Condition 1: Enough time after trigger. We want to record some time after the detection occurs.
    enough_post_frames = (
        self.post_trigger_count >= (self.seconds_after_trigger * self.fps)
    )
    
    # Condition 2: Minimum total duration met
    total_frames = len(self.pre_trigger_snapshot) + len(self.post_trigger_frames)
    enough_total_duration = (
        total_frames >= (self.min_length_seconds * self.fps)
    )
    
    return enough_post_frames and enough_total_duration
```

### Queue Management Best Practices

```python
# In trigger detection process
try:
    trigger_queue.put("get_video", block=False)
except queue.Full:
    logger.warning("Trigger queue full - dropping trigger")

# In recording process
try:
    trigger = trigger_queue.get(timeout=0.1)
    self.handle_trigger(trigger)
except queue.Empty:
    continue  # Normal operation
```

## Key Takeaways for my implementation

1. **Separate concerns**: Frame capture, detection, and recording should be independent processes
2. **Choose communication wisely**: ZeroMQ for data, multiprocessing.Queue for control
3. **Handle edge cases**: Overlapping triggers, memory limits, process failures

This architecture helps the critical recording function to remain responsive even when AI detection models struggle under computational load, exactly what you need for reliable edge AI deployment.

## The Engineering Reality of Edge Computer Vision

So here's the thing nobody talks about enough: building production computer vision systems is way harder than just getting your model to work. All those YouTube tutorials and Medium articles? They're garbage. They show you how to get 99% accuracy on CIFAR-10 and call it a day.

Edge AI makes this even worse. You can't just rent bigger servers when your elderly care device needs to run on a Jetson Nano with 4GB of RAM. Suddenly you're dealing with:

- Memory constraints that force you to think about every single frame
- Concurrent programming (which, let's be honest, most of us avoided in school)
- Real-time requirements where "close enough" isn't good enough
- Hardware limitations that make your beautiful architecture crumble

And guess what? Ring buffers. That's what saves your ass. Not transformer models, not the latest PyTorch release. A basic computer science concept from the 1970s.

## Language Considerations

Oh, and there's Python's Global Interpreter Lock to deal with. The GIL basically means you can't do real multi-threading for CPU-heavy stuff, which is why we ended up with all this process-based architecture and the inter-process communication mess that comes with it. If you're working in C++, Rust, or Go, you could probably do this whole thing with threads and shared memory, which would be cleaner and faster. But the core ideas are the same: keep things separate, don't block the critical paths, and design for whatever hardware constraints you're stuck with.

## Final Thoughts

Look, I've learned this the hard way: you can have the most accurate fall detection model in the world, but if you can't handle the video stream properly, it's just useless code. 

The gap between "my model works in Jupyter" and "my model works on a device someone's grandmother depends on" is huge. And it's filled with boring shit like ring buffers that don't make it into the flashy AI demos. We'll explore more of this boring-but-actually-important stuff in other posts.

Stop obsessing over model architectures and learn the systems side. Because at the end of the day, reliability trumps accuracy when you're dealing with real-world applications. Your 99.9% accurate model is worthless if it crashes every 10 minutes.

The ring buffer is just one piece of the puzzle, but it's a perfect example of how old-school computer science concepts still matter. Sometimes the most important part of your system is the part that just quietly does its job in the background.

---

*Have you dealt with similar challenges in your computer vision projects? I'd love to hear about your experiences with real-time systems and edge deployment.*

