/**
 * Delaunay Triangulation & SPX Voronoi Logistics Partitioning
 * 
 * Partitions 2D logistics network of fulfillment hubs into optimal Voronoi coverage cells
 * and computes direct transport corridors using incremental Bowyer-Watson Delaunay Triangulation.
 */

class DelaunayVoronoiLogistics {
  constructor() {
    this.hubs = new Map(); // id -> { id, x, y, ...meta }
    this.triangles = []; // list of { a: id, b: id, c: id, circumcenter: {x,y}, circumRadiusSq }
    this.adjacency = new Map(); // id -> Set of neighbor hub IDs
  }

  addHub(id, x, y, meta = {}) {
    this.hubs.set(id, {
      id,
      x: Number(x),
      y: Number(y),
      name: meta.name || id,
      province: meta.province || "",
      capacity: meta.capacity || 1000,
      ...meta,
    });
    this.triangles = [];
    this.adjacency.clear();
    return this;
  }

  getHub(id) {
    return this.hubs.get(id) || null;
  }

  _circumcircle(p1, p2, p3) {
    const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
    if (Math.abs(d) < 1e-9) {
      // Collinear or degenerate
      return null;
    }

    const p1Sq = p1.x * p1.x + p1.y * p1.y;
    const p2Sq = p2.x * p2.x + p2.y * p2.y;
    const p3Sq = p3.x * p3.x + p3.y * p3.y;

    const ux = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / d;
    const uy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / d;

    const rSq = (p1.x - ux) * (p1.x - ux) + (p1.y - uy) * (p1.y - uy);
    return { x: ux, y: uy, rSq, r: Math.sqrt(rSq) };
  }

  triangulate() {
    const points = Array.from(this.hubs.values());
    if (points.length < 3) {
      this.triangles = [];
      this.adjacency.clear();
      if (points.length === 2) {
        this._addEdge(points[0].id, points[1].id);
      }
      return this.triangles;
    }

    // 1. Determine bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const dx = maxX - minX || 10;
    const dy = maxY - minY || 10;
    const deltaMax = Math.max(dx, dy) * 20;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Super-triangle vertices
    const st1 = { id: "__ST1__", x: midX - 2 * deltaMax, y: midY - deltaMax };
    const st2 = { id: "__ST2__", x: midX, y: midY + 2 * deltaMax };
    const st3 = { id: "__ST3__", x: midX + 2 * deltaMax, y: midY - deltaMax };

    let currentTriangles = [
      {
        a: st1,
        b: st2,
        c: st3,
        circle: this._circumcircle(st1, st2, st3)
      }
    ];

    // 2. Incremental insertion (Bowyer-Watson)
    for (const point of points) {
      const badTriangles = [];

      for (const tri of currentTriangles) {
        if (!tri.circle) continue;
        const distSq = (point.x - tri.circle.x) ** 2 + (point.y - tri.circle.y) ** 2;
        if (distSq <= tri.circle.rSq + 1e-9) {
          badTriangles.push(tri);
        }
      }

      // Find boundary polygon of the hole
      const edgeCount = new Map();
      const edgeKey = (u, v) => (u.id < v.id ? `${u.id}:::${v.id}` : `${v.id}:::${u.id}`);

      for (const tri of badTriangles) {
        const edges = [
          [tri.a, tri.b],
          [tri.b, tri.c],
          [tri.c, tri.a]
        ];
        for (const [u, v] of edges) {
          const key = edgeKey(u, v);
          if (!edgeCount.has(key)) {
            edgeCount.set(key, { u, v, count: 1 });
          } else {
            edgeCount.get(key).count += 1;
          }
        }
      }

      const polygonEdges = [];
      for (const val of edgeCount.values()) {
        if (val.count === 1) {
          polygonEdges.push([val.u, val.v]);
        }
      }

      // Remove bad triangles
      currentTriangles = currentTriangles.filter((t) => !badTriangles.includes(t));

      // Re-triangulate hole with new point
      for (const [u, v] of polygonEdges) {
        const circle = this._circumcircle(u, v, point);
        currentTriangles.push({
          a: u,
          b: v,
          c: point,
          circle
        });
      }
    }

    // 3. Filter out triangles sharing super-triangle vertices
    const isSuperVertex = (p) => p.id === "__ST1__" || p.id === "__ST2__" || p.id === "__ST3__";
    this.triangles = currentTriangles
      .filter((t) => !isSuperVertex(t.a) && !isSuperVertex(t.b) && !isSuperVertex(t.c))
      .map((t) => ({
        a: t.a.id,
        b: t.b.id,
        c: t.c.id,
        circumcenter: { x: t.circle.x, y: t.circle.y },
        circumRadius: t.circle.r,
      }));

    // 4. Build adjacency graph
    this.adjacency.clear();
    for (const t of this.triangles) {
      this._addEdge(t.a, t.b);
      this._addEdge(t.b, t.c);
      this._addEdge(t.c, t.a);
    }

    return this.triangles;
  }

  _addEdge(uId, vId) {
    if (!this.adjacency.has(uId)) this.adjacency.set(uId, new Set());
    if (!this.adjacency.has(vId)) this.adjacency.set(vId, new Set());
    this.adjacency.get(uId).add(vId);
    this.adjacency.get(vId).add(uId);
  }

  getAdjacencyGraph() {
    if (this.adjacency.size === 0 && this.hubs.size > 0) {
      this.triangulate();
    }
    const result = {};
    for (const [id, neighbors] of this.adjacency.entries()) {
      result[id] = Array.from(neighbors);
    }
    return result;
  }

  findNearestHub(x, y) {
    let nearest = null;
    let minDistSq = Infinity;

    for (const hub of this.hubs.values()) {
      const distSq = (hub.x - x) ** 2 + (hub.y - y) ** 2;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = hub;
      }
    }

    return nearest ? { hub: nearest, distance: Math.sqrt(minDistSq) } : null;
  }

  detectLogisticsGaps(minRadius = 15) {
    if (this.triangles.length === 0) this.triangulate();
    const gaps = [];
    for (const tri of this.triangles) {
      if (tri.circumRadius >= minRadius) {
        gaps.push({
          regionCenter: tri.circumcenter,
          coverageRadius: tri.circumRadius,
          boundaryHubs: [tri.a, tri.b, tri.c],
          severity: tri.circumRadius > minRadius * 1.5 ? "HIGH" : "MEDIUM"
        });
      }
    }
    return gaps.sort((a, b) => b.coverageRadius - a.coverageRadius);
  }
}

export { DelaunayVoronoiLogistics };
export default DelaunayVoronoiLogistics;
