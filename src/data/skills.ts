export interface SkillCategory {
  id: string;
  name: string;
  color: "cyan" | "blue" | "violet" | "amber";
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    id: "programming",
    name: "Programming & Data Science",
    color: "cyan",
    skills: [
      "Python",
      "NumPy",
      "Pandas",
      "OpenCV",
      "Matplotlib",
      "Seaborn",
      "SciPy",
      "R",
      "C/C++",
      "C#",
      "MATLAB",
      "VHDL",
    ],
  },
  {
    id: "deep-learning",
    name: "Deep Learning & Computer Vision",
    color: "blue",
    skills: [
      "PyTorch",
      "TensorFlow",
      "YOLOv8",
      "Object Detection",
      "Object Tracking",
      "Homography",
      "Video Processing",
      "Neural Networks",
      "Model Training",
    ],
  },
  {
    id: "specialized",
    name: "Radar & Sensor Systems",
    color: "violet",
    skills: [
      "Radar Signal Processing",
      "Doppler Analysis",
      "4D Point Clouds",
      "GPS/Coordinate Systems",
      "Sensor Fusion",
      "BEV Architectures",
      "Multi-Modal Data",
      "Temporal Synchronization",
    ],
  },
  {
    id: "tools",
    name: "Simulation & Hardware",
    color: "amber",
    skills: [
      "Simulink",
      "Proteus",
      "PSpice",
      "ModelSim",
      "emu8086",
      "Arduino",
      "UART/SPI/I2C",
      "Git",
      "Linux",
      "LaTeX",
    ],
  },
];
