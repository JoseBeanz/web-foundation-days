SnapShare Scaling Plan
1. Assumptions
Registered users: 10,000,000 (given)

Daily active users (DAU): 10% of registered users = 1,000,000 DAU

Uploads: Each active user uploads 1 photo per day

Feed views: Each active user views 50 feed pages per day

Average photo size: 2 MB (original) + 50 KB (thumbnail) = ~2.05 MB per uploaded photo

Peak factor: 5× average traffic (typical for social apps with evening spikes)

Traffic distribution: Assumed roughly uniform across a 24-hour day for average calculations; peak concentrated in a few hours

Reads per feed page: Assume one feed page = one "feed view" request (the API call that returns a page of photo metadata)

Thumbnails: Generated asynchronously by a worker after upload

Growth: No year-over-year user growth assumed for the base storage estimate (can be added as a sensitivity note)

2. Estimates
Daily active users
10,000,000 × 10% = 1,000,000 DAU

Uploads per second
Daily uploads = 1,000,000 × 1 = 1,000,000 uploads/day

Seconds per day = 86,400

Average uploads/sec = 1,000,000 / 86,400 ≈ 11.6 uploads/sec

Peak uploads/sec = 11.6 × 5 ≈ 58 uploads/sec

Feed views per second
Daily feed views = 1,000,000 × 50 = 50,000,000 feed views/day

Average feed views/sec = 50,000,000 / 86,400 ≈ 579 feed views/sec

Peak feed views/sec = 579 × 5 ≈ 2,893 feed views/sec

Storage per year
Per photo (original + thumbnail) = 2 MB + 50 KB = 2.05 MB

Daily storage = 1,000,000 × 2.05 MB = 2,050,000 MB ≈ 2.05 TB/day

Yearly storage = 2.05 TB × 365 ≈ 748 TB/year (≈ 0.75 PB/year)

Note: without replication/backups. With 3× replication in object storage, effective raw storage ≈ 2.2 PB/year.

3. Read-heavy or write-heavy?
The system is heavily read-heavy.

Reads: ~579 feed views/sec average (~2,893 peak)

Writes: ~11.6 uploads/sec average (~58 peak)

The read:write ratio is roughly 50:1 on average (50 feed views per 1 upload per user). This means the design must prioritize:

Caching feed data and photo metadata aggressively (Redis/Memcached).

Read replicas for the database to scale read queries.

CDN to serve photo bytes and thumbnails close to users, offloading origin.

Denormalization of feed data so a feed page can be served with few queries.

Write path can be simpler and asynchronous (queue for thumbnails) since write volume is low.

4. Why photos should not be stored in the database
Storing 2 MB photo blobs in a relational database is a bad fit because:

Database bloat: 748 TB/year of blobs would make the DB enormous, slow backups, and expensive to scale.

Poor streaming: DBs are not optimized for serving large binary objects over HTTP; object storage + CDN is.

Cost: Object storage (e.g., S3) is far cheaper per GB than DB storage.

Coupling: Blob traffic would compete with metadata queries, hurting feed latency.

Replication cost: Replicating huge blobs to read replicas is wasteful.

Where they should go: The original photo files and thumbnails belong in object storage (e.g., S3/GCS), served through a CDN. The database stores only metadata (photo ID, owner, caption, object-storage key/URL, timestamp, thumbnail URL).

5. Architecture diagram (text)
text
                        ┌─────────────┐
        Users ─────────▶│    CDN      │◀──── photo bytes / thumbnails
                        └──────┬──────┘
                               │ (cache miss → origin)
                               ▼
                        ┌─────────────┐
                        │    Load     │
                        │  Balancer   │
                        └──────┬──────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
           ┌──────────┐  ┌──────────┐  ┌──────────┐
           │  App     │  │  App     │  │  App     │
           │ Server 1 │  │ Server 2 │  │ Server N │
           └────┬─────┘  └────┬─────┘  └────┬─────┘
                │             │             │
        ┌───────┼─────────────┼─────────────┼────────┐
        ▼       ▼             ▼             ▼        ▼
   ┌────────┐ ┌────────┐  ┌──────────────┐ ┌──────────────┐
   │ Cache  │ │ Queue  │  │  Database    │ │ Object       │
   │(Redis) │ │(SQS/   │  │  (primary)   │ │ Storage      │
   │        │ │ Kafka) │  │      │       │ │ (S3/GCS)     │
   └────────┘ └───┬────┘  │      ▼       │ └──────────────┘
                  │       │  Read Replica│        ▲
                  ▼       └──────────────┘        │
           ┌────────────┐                         │
           │ Thumbnail  │─────────────────────────┘
           │  Worker    │  (writes thumbnail to object storage,
           └────────────┘   updates DB metadata)

6. Component explanations (one sentence each)
CDN: Caches and serves photo bytes and thumbnails from edge locations near users, drastically reducing origin bandwidth and latency for the read-heavy feed.

Load balancer: Distributes incoming API traffic across app servers and routes around unhealthy instances, preventing any single server from being overwhelmed.

App servers: Stateless servers that implement the API (upload, feed, auth), validate requests, talk to cache/DB/queue/object storage, and can be horizontally scaled.

Cache (Redis): Stores hot feed pages, photo metadata, and session data in memory so the vast majority of feed reads never hit the database.

Database (primary + read replica): The primary handles writes (new photo metadata, follows) while the read replica serves feed and metadata reads, scaling the read-heavy workload.

Object storage (S3/GCS): Durably stores the original photo files and generated thumbnails at low cost, decoupled from the database.

Queue (SQS/Kafka): Buffers thumbnail-generation jobs so uploads return fast and image processing can happen asynchronously and be retried.

Thumbnail worker: Consumes jobs from the queue, downloads the original from object storage, generates the 50 KB thumbnail, uploads it, and updates metadata in the database.

7. Upload flow (step by step)
    1. Client requests upload: App server authenticates the user and returns a pre-signed object-storage URL (so the photo never passes through app servers).

    2. Client uploads photo directly to object storage using the pre-signed URL; object storage confirms success.

    3. Client notifies app server of the completed upload (with the object key, caption, etc.).

    4. App server writes photo metadata to the database primary (photo ID, owner, object key, caption, timestamp, status = "processing").

    5. App server enqueues a thumbnail job on the queue containing the photo ID and object key.

    6. App server returns success to the client immediately — the upload is done from the user's perspective.

    7. Thumbnail worker picks up the job, downloads the original from object storage, generates the 50 KB thumbnail, uploads it to object storage, and     updates the DB metadata (thumbnail URL, status = "ready").

    8. Feed generation: When the user's followers request their feed, the app server reads feed/metadata from cache (or DB read replica on miss), and the CDN serves the photo and thumbnail bytes.

    9. Failure handling: If the worker fails, the queue retries; after max retries the job goes to a dead-letter queue and the photo stays marked "processing" for investigation.

8. Trade-offs
    1. Pre-signed direct-to-object-storage uploads vs. proxying through app servers.
    Chosen: direct uploads. Benefit: app servers never handle 2 MB blobs, so they stay cheap and scalable. Cost: less control/inspection of uploads at the app layer (need object-storage-side validation, virus scanning as a separate async step, and careful pre-signed URL expiry).

    2. Asynchronous thumbnail generation vs. synchronous.
    Chosen: async via queue. Benefit: uploads return in milliseconds and the worker fleet scales independently. Cost: eventual consistency — a photo may briefly appear without a thumbnail (need a placeholder), and the system must handle retries/dead-letter queues.

    3. Aggressive caching + read replicas vs. strong consistency.
    Chosen: cache-first feed reads with read replicas. Benefit: handles ~2,900 feed views/sec at peak cheaply and with low latency. Cost: users may see slightly stale feeds (e.g., a new post appears a few seconds late), and cache invalidation adds complexity.

    4. Storing originals at full 2 MB vs. compressing/resizing at upload.
    Chosen: store originals as-is (plus thumbnail). Benefit: preserves quality and allows future re-processing. Cost: ~748 TB/year of storage — significant cost, which could be reduced by tiering older photos to cold storage (another trade-off of cost vs. retrieval latency).

Daily active users: 1,000,000. Uploads/sec: ~11.6 avg / ~58 peak. Feed views/sec: ~579 avg / ~2,893 peak. Storage: ~748 TB/year (~0.75 PB). System is read-heavy (~50:1).