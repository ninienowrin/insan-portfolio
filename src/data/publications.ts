export type PublicationType = "journal" | "conference" | "under-review";

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: PublicationType;
  doi?: string;
  tags: string[];
  featured?: boolean;
}

export const publications: Publication[] = [
  {
    id: "iot-roadsense",
    title:
      "An IoT Based Smart Road Safety System: Vehicle Detection and Classification Using Smartphone Sensors",
    authors: [
      "Insan Arafat Jahan",
      "Kazi Md. Toufiqul Hasan",
      "Md. Forhadul Islam",
    ],
    venue: "IEEE Internet of Things Journal",
    year: 2023,
    type: "journal",
    doi: "10.1109/JIOT.2023.XXXXXXX",
    tags: ["IoT", "Smartphone Sensors", "Vehicle Classification", "ML"],
    featured: true,
  },
  {
    id: "sensor-fusion-tiv",
    title:
      "Multi-Modal Sensor Fusion for Enhanced Traffic Perception in Connected Vehicle Environments",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "IEEE Transactions on Intelligent Vehicles",
    year: 2024,
    type: "journal",
    doi: "10.1109/TIV.2024.XXXXXXX",
    tags: ["Sensor Fusion", "Connected Vehicles", "Deep Learning"],
    featured: true,
  },
  {
    id: "radar-bev-trb",
    title:
      "Drone-Supervised Radar-Camera BEV Fusion for 3D Object Detection in Transportation Scenarios",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "Transportation Research Board (TRB) Annual Meeting",
    year: 2025,
    type: "conference",
    tags: ["Radar", "BEV Fusion", "3D Detection", "Drone Supervision"],
    featured: true,
  },
  {
    id: "digital-twin-trb",
    title:
      "Digital Twin Framework for Smart Intersection: Multi-Sensor Deployment Optimization",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "Transportation Research Board (TRB) Annual Meeting",
    year: 2025,
    type: "conference",
    tags: ["Digital Twin", "Smart Intersection", "Sensor Optimization"],
  },
  {
    id: "vr-traffic-ite",
    title:
      "Immersive VR Reconstruction of Real-World Traffic Scenarios from CCTV Data",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "ITE Annual Meeting & Exhibition",
    year: 2025,
    type: "conference",
    tags: ["VR", "Traffic Reconstruction", "CCTV", "Meta Quest"],
  },
  {
    id: "range-adaptive-fusion",
    title:
      "Range-Adaptive Radar-Camera Fusion for Robust All-Weather 3D Object Detection",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "Under Review",
    year: 2025,
    type: "under-review",
    tags: ["Radar-Camera Fusion", "All-Weather", "3D Detection"],
  },
  {
    id: "temporal-sensor-fusion",
    title:
      "Temporal Sensor Fusion with Attention Mechanisms for Dynamic Traffic Scene Understanding",
    authors: [
      "Insan Arafat Jahan",
      "Mohamed Abdel-Aty",
    ],
    venue: "Under Review",
    year: 2025,
    type: "under-review",
    tags: ["Temporal Fusion", "Attention", "Scene Understanding"],
  },
];

export const publicationCounts: Record<PublicationType | "all", number> = {
  all: publications.length,
  journal: publications.filter((p) => p.type === "journal").length,
  conference: publications.filter((p) => p.type === "conference").length,
  "under-review": publications.filter((p) => p.type === "under-review").length,
};
