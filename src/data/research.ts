export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  color: "cyan" | "blue" | "violet" | "amber";
  funding?: string;
}

export const researchProjects: ResearchProject[] = [
  {
    id: "sensor-fusion",
    title: "Radar-Camera Sensor Fusion",
    description:
      "Developing drone-supervised BEV (bird's-eye-view) fusion architectures that combine 4D radar point clouds with camera imagery for robust 3D object detection. The pipeline addresses range-adaptive challenges and all-weather performance degradation in real transportation scenarios.",
    icon: "Radar",
    tags: ["4D Radar", "BEV Fusion", "YOLOv8", "PyTorch", "Point Clouds"],
    color: "cyan",
    funding: "FDOT",
  },
  {
    id: "digital-twin",
    title: "Digital Twin for Smart Intersections",
    description:
      "Building a digital twin framework that mirrors real-world intersections using multi-sensor data streams. The system optimizes sensor deployment configurations and enables virtual testing of traffic management strategies before physical implementation.",
    icon: "Box",
    tags: ["Digital Twin", "Multi-Sensor", "Simulation", "Optimization"],
    color: "blue",
    funding: "FDOT",
  },
  {
    id: "iot-roadsense",
    title: "IoT Road Safety Monitoring",
    description:
      "Designed and deployed RoadSense — an IoT-based system using smartphone accelerometer and gyroscope data with machine learning classifiers to detect road anomalies like potholes and harsh braking events in real time.",
    icon: "Smartphone",
    tags: ["IoT", "Accelerometer", "ML Classification", "Arduino", "GPS"],
    color: "violet",
  },
  {
    id: "vr-reconstruction",
    title: "VR Traffic Reconstruction",
    description:
      "Created an immersive pipeline that transforms CCTV traffic footage into navigable VR environments on Meta Quest 2. Uses computer vision for vehicle detection and trajectory extraction, then reconstructs the scene in a virtual reality framework.",
    icon: "Eye",
    tags: ["VR", "Computer Vision", "CCTV", "Meta Quest 2", "Unity"],
    color: "amber",
  },
];
