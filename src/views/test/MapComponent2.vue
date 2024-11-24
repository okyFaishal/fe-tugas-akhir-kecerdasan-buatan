<template>
  <div>
    <div id="map" style="height: 500px;"></div>
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "BFSRouting",
  data() {
    return {
      map: null, // Objek Leaflet map
      graph: {}, // Graph representasi jalan
      start: null, // Titik awal (koordinat)
      goal: null, // Titik tujuan (koordinat)
      routeLayer: null, // Layer untuk menampilkan rute
    };
  },
  methods: {
    async initializeMap() {
      // Inisialisasi peta
      this.map = L.map("map").setView([-6.2, 106.8], 14);

      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.map);

      // Event klik untuk menentukan titik awal dan tujuan
      this.map.on("click", (e) => {
        if (!this.start) {
          console.log(1)
          this.start = e.latlng;
          L.marker(this.start).addTo(this.map).bindPopup("Start").openPopup();
        } else if (!this.goal) {
          console.log(2)
          this.goal = e.latlng;
          L.marker(this.goal).addTo(this.map).bindPopup("Goal").openPopup();
          this.findRoute(); // Cari rute setelah menentukan tujuan
        }
      });

      // Load data jalan dan buat graph
      await this.loadRoadData();
    },
    async loadRoadData() {
      // Ambil data jalan dari Overpass API
      const url =
        "https://overpass-api.de/api/interpreter?data=[out:json];way[highway](around:1000,-6.2,106.8);out;>;out skel;";
      const response = await fetch(url);
      const data = await response.json();
      
      // Proses data jalan menjadi graph
      this.graph = await this.buildGraph(data);
      console.log("this.graph", this.graph)
      console.log("data", data)
    },
    async buildGraph(data) {
      const graph = {};
      const nodes = {};

      // Kumpulkan semua simpul (node)
      data.elements.forEach((element) => {
        if (element.type === "node") {
          nodes[element.id] = [element.lat, element.lon];
        }
      });

      // Bangun graph berdasarkan koneksi antar simpul
      data.elements.forEach((element) => {
        if (element.type === "way") {
          const wayNodes = element.nodes;
          for (let i = 0; i < wayNodes.length - 1; i++) {
            const a = wayNodes[i];
            const b = wayNodes[i + 1];

            if (!graph[a]) graph[a] = [];
            if (!graph[b]) graph[b] = [];

            graph[a].push(b);
            graph[b].push(a);
          }
        }
      });

      return { graph, nodes };
    },
    findRoute() {
      // Cari rute menggunakan BFS
      const startNode = this.findClosestNode(this.start);
      const goalNode = this.findClosestNode(this.goal);
      const path = this.bfs(startNode, goalNode);

      if (path) {
        this.drawRoute(path);
      } else {
        alert("Tidak ada rute yang ditemukan.");
      }
    },
    findClosestNode(latlng) {
      // Cari node terdekat berdasarkan koordinat
      let closestNode = null;
      let closestDistance = Infinity;

      for (const [nodeId, [lat, lon]] of Object.entries(this.graph.nodes)) {
        const distance = this.calculateDistance(latlng.lat, latlng.lng, lat, lon);
        if (distance < closestDistance) {
          closestNode = nodeId;
          closestDistance = distance;
        }
      }
      return closestNode;
    },
    calculateDistance(lat1, lon1, lat2, lon2) {
      // Hitung jarak antara dua koordinat (Haversine formula)
      const R = 6371; // Radius bumi dalam km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    bfs(start, goal) {
      const queue = [[start]];
      console.log('queue 1', queue)
      console.log('queue 2', queue.shift())
      const visited = new Set();
      visited.add(start);

      while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === goal) {
          return path;
        }

        for (const neighbor of this.graph.graph[node] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push([...path, neighbor]);
          }
        }
      }
      return null; // Tidak ada rute yang ditemukan
    },
    drawRoute(path) {
      // Gambarkan rute pada peta
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
      }

      const latlngs = path.map((nodeId) => this.graph.nodes[nodeId]);
      this.routeLayer = L.polyline(latlngs, { color: "blue" }).addTo(this.map);
    },
  },
  async mounted() {
    await this.initializeMap();

    let graph = this.graph.graph
    let i = 0
    for (const key in this.graph.graph) {
      if(i <= 1000){
        // console.log(this.graph.graph[key])
        const coordinates = []
        for (let i = 0; i < this.graph.graph[key].length; i++) {
          const node = this.graph.graph[key][i];
          // console.log('node', this.graph.nodes[node])
          coordinates.push(this.graph.nodes[node])
        }
        let polyline = L.polyline(coordinates, { color: "blue" }).addTo(this.map);
        this.map.fitBounds(polyline.getBounds());
        // break
      }
      i++
    }
    // console.log(this.graph.graph)

    // const coordinates = [
    //     [51.505, -0.09], // Titik pertama (Latitude, Longitude)
    //     [51.51, -0.1],  // Titik kedua
    //     [51.52, -0.12], // Titik ketiga
    //   ]
    // // Tambahkan garis berdasarkan koordinat
    // let polyline = L.polyline(coordinates, { color: "blue" }).addTo(this.map);

    // // Sesuaikan tampilan peta agar sesuai dengan garis
    // this.map.fitBounds(polyline.getBounds());
  },
};
</script>

<style>
#map {
  height: 500px;
  width: 100%;
}
</style>
